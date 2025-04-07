import { fetchPointData, updateForecastHeaderWithPointData, updateCurrentConditionsWithPointData } from './forecast.js';
import { renderFavorites, pinCurrentLocation, editFavorite, deleteFavorite } from './favorites.js';
import { updateRadarLayer } from './radar.js';
import { copyForecastLimited, copyAlerts } from './clipboard.js';
import { searchLocation } from './search.js';
import { openSpcWindow } from './spc.js';
import { renderForecastToContainer, renderAlertsToContainer } from './render.js';

// Global variables
let map;
let selectedLocation = null;
let currentFavorites = [];
let currentMarker = null;

window.addEventListener('DOMContentLoaded', async () => {
  // Initialize Leaflet map and expose globally
  map = L.map('map').setView([39.5, -98.35], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  updateRadarLayer(map);
  setInterval(() => updateRadarLayer(map), 5 * 60 * 1000);
  console.log("Map initialized");

  // DOM elements
  const forecastDiv = document.getElementById('forecast');
  const spinner = document.getElementById('forecast-loading');
  const alertsDiv = document.getElementById('alerts');

  if (!forecastDiv || !spinner || !alertsDiv) {
    console.error("Missing forecast or alert container.");
    return;
  }

  window.copyForecast3 = () => copyForecastLimited(3);
  window.copyForecast5 = () => copyForecastLimited(5);
  window.copyForecastAll = () => copyForecastLimited(7);
  window.copyAlerts = copyAlerts;
  window.openSpcWindow = openSpcWindow;

  // Load favorites
  try {
    currentFavorites = await window.api.loadFavorites();
    renderFavorites(currentFavorites);
    // Make favorites-related functions available to index.html
    window.pinCurrentLocation = () => pinCurrentLocation(selectedLocation, currentFavorites, renderFavorites);
    window.editFavorite = (index) => editFavorite(index, currentFavorites, renderFavorites);
    window.deleteFavorite = (index) => deleteFavorite(index, currentFavorites, renderFavorites);
  } catch (err) {
    console.error('Error loading favorites:', err);
  }

  // 🟢 Attach click handler now that DOM + map are ready
  map.on('click', async function (e) {
    console.log('Map clicked:', e.latlng);
    selectedLocation = e.latlng;

    // Ensure the spinner exists.
    let spinner = document.getElementById('forecast-loading');
    if (!spinner) {
      spinner = document.createElement('div');
      spinner.id = 'forecast-loading';
      spinner.classList.add('spinner', 'hidden');
      forecastDiv.prepend(spinner);
      console.log("Spinner recreated.");
    }

    // Clear forecastDiv while preserving the spinner element.
    Array.from(forecastDiv.children).forEach(child => {
      if (child.id !== 'forecast-loading') {
        child.remove();
      }
    });
    // Clear alerts normally.
    alertsDiv.innerHTML = '';

    // Show spinner.
    spinner.classList.remove("hidden");
    console.log("Spinner should be visible now.", spinner);

    // Remove any existing marker.
    if (currentMarker) {
      map.removeLayer(currentMarker);
      console.log("Existing marker removed.");
    }

    try {
      currentMarker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
      console.log("Marker added at:", selectedLocation);

      // Force browser to repaint the spinner.
      await new Promise(resolve => {
        console.log("Starting spinner delay...");
        setTimeout(() => {
          console.log("Spinner delay complete.");
          resolve();
        }, 0);
      });

      const weatherForecast = await window.api.fetchWeather(selectedLocation.lat, selectedLocation.lng);
      console.log("Weather forecast data received:", weatherForecast);

      const activeAlerts = await window.api.fetchAlerts(selectedLocation.lat, selectedLocation.lng);
      console.log("Active alerts data received:", activeAlerts);

      const pointData = await fetchPointData(selectedLocation.lat, selectedLocation.lng);

      await Promise.all([
        updateForecastHeaderWithPointData(pointData).then(() => console.log("Forecast header updated.")),
        updateCurrentConditionsWithPointData(pointData).then(() => console.log("Current conditions updated."))
      ]);

      // Append new forecast content without overwriting the spinner.
      renderForecastToContainer(forecastDiv, weatherForecast);
      renderAlertsToContainer(alertsDiv, activeAlerts);

    } catch (err) {
      console.error('Error fetching weather or alerts:', err);
    } finally {
      spinner.classList.add("hidden");
      console.log("Spinner hidden.");
    }
  });

  // Wire up search box and favorite search
  document.getElementById("locationSearch").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();

      // Only needs to set selectedLocation now — everything else happens inside search.js
      window.searchLocation = () =>
        searchLocation(
          map,
          { value: currentMarker },
          (lat, lon) => { selectedLocation = { lat, lng: lon }; }
        );

      window.searchLocation(); // Trigger search immediately
    }
  });

  document.getElementById("favoriteSearch").addEventListener("input", () => {
    renderFavorites(currentFavorites);
  });

  // Dark Mode Toggle
  const darkModeToggleButton = document.getElementById('toggleDarkMode');
  if (darkModeToggleButton) {
    // Check localStorage for saved theme preference
    if (localStorage.getItem("dark-mode") === "enabled") {
      document.body.classList.add("dark-mode");
      darkModeToggleButton.textContent = "☀️"; // Sun icon for dark mode
    } else {
      darkModeToggleButton.textContent = "🌙"; // Moon icon for light mode
    }

    darkModeToggleButton.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");

      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("dark-mode", "enabled");
        darkModeToggleButton.textContent = "☀️";
      } else {
        localStorage.setItem("dark-mode", "disabled");
        darkModeToggleButton.textContent = "🌙";
      }
    });
  }
});

// Jump to favorite and fetch data
window.goToFavorite = async function (lat, lng) {
  selectedLocation = { lat, lng };
  map.setView([lat, lng], 10);

  const forecastDiv = document.getElementById('forecast');
  const alertsDiv = document.getElementById('alerts');

  // Ensure the spinner exists; if not, create it and prepend to forecastDiv.
  let spinner = document.getElementById('forecast-loading');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'forecast-loading';
    spinner.classList.add('spinner', 'hidden');
    forecastDiv.prepend(spinner);
  }

  // Remove all forecast content except the spinner.
  Array.from(forecastDiv.children).forEach(child => {
    if (child.id !== 'forecast-loading') {
      child.remove();
    }
  });
  // Clear alerts container normally.
  alertsDiv.innerHTML = '';

  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  currentMarker = L.marker([lat, lng]).addTo(map);

  // Show the spinner.
  spinner.classList.remove("hidden");
  // Force a repaint by yielding to the event loop.
  await new Promise(resolve => setTimeout(resolve, 0));

  try {
    const weatherForecast = await window.api.fetchWeather(lat, lng);
    const activeAlerts = await window.api.fetchAlerts(lat, lng);
    const pointData = await fetchPointData(lat, lng);
    await Promise.all([
      updateForecastHeaderWithPointData(pointData),
      updateCurrentConditionsWithPointData(pointData)
    ]);

    renderForecastToContainer(forecastDiv, weatherForecast);
    renderAlertsToContainer(alertsDiv, activeAlerts);

  } catch (err) {
    console.error('Error fetching weather or alerts for favorite:', err);
  } finally {
    // Hide the spinner.
    spinner.classList.add("hidden");
  }
};

window.copyForecast3 = function () {
  copyForecastLimited(3);
};

window.copyForecast5 = function () {
  copyForecastLimited(5);
};

window.copyForecastAll = function () {
  copyForecastLimited(7);
};
