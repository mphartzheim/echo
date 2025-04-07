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
  console.log("Map initialized");

  // DOM elements
  const forecastDiv = document.getElementById('forecast');
  const spinner = document.getElementById('forecast-loading');
  const alertsDiv = document.getElementById('alerts');

  if (!forecastDiv || !spinner || !alertsDiv) {
    console.error("Missing forecast or alert container.");
    return;
  }

  // Load favorites
  try {
    currentFavorites = await window.api.loadFavorites();
    renderFavorites(currentFavorites);
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
  
      await updateForecastHeaderWithLocation(selectedLocation.lat, selectedLocation.lng);
      console.log("Forecast header updated.");
      await updateCurrentConditions(selectedLocation.lat, selectedLocation.lng);
      console.log("Current conditions updated.");
  
      // Append new forecast content without overwriting the spinner.
      if (weatherForecast?.length) {
        const forecastHtml = weatherForecast.map(period => `
          <div>
            <strong>${period.name}:</strong>
            <p>${period.detailedForecast}</p>
          </div>
        `).join('');
        // Append forecast content after the spinner.
        forecastDiv.insertAdjacentHTML('beforeend', `<h3>🌤️ 7-Day Forecast</h3>${forecastHtml}`);
        console.log("Forecast rendered.");
      } else {
        console.log("No weather forecast data available.");
      }
  
      if (activeAlerts?.length) {
        const alertsHtml = activeAlerts.map(alert => `
          <div>
            <strong>${alert.properties.headline}</strong>
            <p>${alert.properties.description}</p>
          </div>
        `).join('');
        alertsDiv.innerHTML = `<h3>Active Alerts</h3>${alertsHtml}`;
        console.log("Alerts rendered.");
      } else {
        console.log("No active alerts data available.");
      }
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
      window.searchLocation();
    }
  });

  document.getElementById("favoriteSearch").addEventListener("input", () => {
    renderFavorites(currentFavorites);
  });
});


// Render favorites
function renderFavorites(favorites) {
  const favoritesDiv = document.getElementById('favorites');
  const searchInput = document.getElementById('favoriteSearch');
  if (!favoritesDiv) return;

  let filtered = favorites;

  if (searchInput && searchInput.value.trim() !== "") {
    const query = searchInput.value.trim().toLowerCase();
    filtered = favorites.filter(fav => fav.name.toLowerCase().includes(query));
  }

  filtered.sort((a, b) => a.name.localeCompare(b.name));

  favoritesDiv.innerHTML = filtered.map((fav, i) => `
    <div class="favorite-item">
      <div class="favorite-content">
        <span class="favorite-name" onclick="window.goToFavorite(${fav.lat}, ${fav.lng})">
          ${fav.name}
        </span>
        <div class="favorite-actions">
          <button class="edit-btn" onclick="window.editFavorite(${i})">✏️</button>
          <button class="delete-btn" onclick="window.deleteFavorite(${i})">❌</button>
        </div>
      </div>
    </div>
  `).join('');
}

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
    await updateForecastHeaderWithLocation(lat, lng);
    await updateCurrentConditions(lat, lng);

    if (weatherForecast?.length) {
      const forecastHtml = weatherForecast.map(period => `
        <div>
          <strong>${period.name}:</strong>
          <p>${period.detailedForecast}</p>
        </div>
      `).join('');
      // Append the new forecast content after the spinner.
      forecastDiv.insertAdjacentHTML('beforeend', `<h3>🌤️ 7-Day Forecast</h3>${forecastHtml}`);
    }

    if (activeAlerts?.length) {
      const alertsHtml = activeAlerts.map(alert => `
        <div>
          <strong>${alert.properties.headline}</strong>
          <p>${alert.properties.description}</p>
        </div>
      `).join('');
      alertsDiv.innerHTML = `<h3>Active Alerts</h3>${alertsHtml}`;
    }
  } catch (err) {
    console.error('Error fetching weather or alerts for favorite:', err);
  } finally {
    // Hide the spinner.
    spinner.classList.add("hidden");
  }
};

// Pin the current map-selected location
window.pinCurrentLocation = async function () {
  if (!selectedLocation) {
    alert("Please click on the map to select a location first!");
    return;
  }

  const { value: name } = await Swal.fire({
    title: 'Enter a name for this location',
    input: 'text',
    inputPlaceholder: 'Favorite location name',
    showCancelButton: true
  });

  if (name) {
    const fav = { name, lat: selectedLocation.lat, lng: selectedLocation.lng };
    currentFavorites.push(fav);
    try {
      await window.api.saveFavorites(currentFavorites);
      renderFavorites(currentFavorites);
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  }
};

// Edit a favorite
window.editFavorite = async function (index) {
  const fav = currentFavorites[index];
  const { value: newName } = await Swal.fire({
    title: 'Edit Favorite',
    input: 'text',
    inputValue: fav.name,
    showCancelButton: true,
    inputPlaceholder: 'Enter new name'
  });

  if (newName && newName !== fav.name) {
    currentFavorites[index].name = newName;
    try {
      await window.api.saveFavorites(currentFavorites);
      renderFavorites(currentFavorites);
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  }
};

// Delete a favorite
window.deleteFavorite = function (index) {
  currentFavorites.splice(index, 1);
  window.api.saveFavorites(currentFavorites)
    .then(() => renderFavorites(currentFavorites))
    .catch(err => console.error('Error saving favorites:', err));
};

// Location search
window.searchLocation = async function () {
  const input = document.getElementById('locationSearch');
  const query = input.value.trim();
  if (!query) return;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      selectedLocation = { lat, lng: lon };

      map.setView([lat, lon], 10);
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }
      currentMarker = L.marker([lat, lon]).addTo(map);

      const weatherForecast = await window.api.fetchWeather(lat, lon);
      const activeAlerts = await window.api.fetchAlerts(lat, lon);
      await updateForecastHeaderWithLocation(lat, lon);
      await updateCurrentConditions(lat, lon);

      const forecastDiv = document.getElementById('forecast');
      const alertsDiv = document.getElementById('alerts');
      forecastDiv.innerHTML = '';
      alertsDiv.innerHTML = '';

      if (weatherForecast?.length) {
        const forecastHtml = weatherForecast.map(period => `
          <div>
            <strong>${period.name}:</strong>
            <p>${period.detailedForecast}</p>
          </div>
        `).join('');
        forecastDiv.innerHTML = `<h3>🌤️ 7-Day Forecast</h3>${forecastHtml}`;
      }

      if (activeAlerts?.length) {
        const alertsHtml = activeAlerts.map(alert => `
          <div>
            <strong>${alert.properties.headline}</strong>
            <p>${alert.properties.description}</p>
          </div>
        `).join('');
        alertsDiv.innerHTML = `<h3></h3>${alertsHtml}`;
      }
    } else {
      alert("Location not found.");
    }
  } catch (err) {
    console.error('Error searching location:', err);
    alert("Error searching for location.");
  }
};

async function updateForecastHeaderWithLocation(lat, lon) {
  try {
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    const data = await response.json();
    const city = data.properties.relativeLocation.properties.city;
    const state = data.properties.relativeLocation.properties.state;
    const locationName = `${city}, ${state}`;
    document.getElementById("forecast-location").textContent = `${locationName}`;
  } catch (err) {
    console.warn('Could not fetch location info:', err);
    document.getElementById("forecast-location").textContent = "";
  }
}

async function updateCurrentConditions(lat, lon) {
  try {
    const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    const pointsData = await pointsResponse.json();
    const observationsUrl = pointsData.properties.observationStations;

    const stationsResponse = await fetch(observationsUrl);
    const stationsData = await stationsResponse.json();
    const firstStation = stationsData.features[0]?.id;
    if (!firstStation) throw new Error("No stations found");

    const conditionsResponse = await fetch(`${firstStation}/observations/latest`);
    const conditionsData = await conditionsResponse.json();
    const props = conditionsData.properties;

    const temp = props.temperature.value;
    let feelsLike = null;
    if (props.heatIndex?.value !== null) {
      feelsLike = props.heatIndex.value;
    } else if (props.windChill?.value !== null) {
      feelsLike = props.windChill.value;
    }
    const description = props.textDescription;
    const updated = new Date(props.timestamp);

    const formatTemp = t => `${Math.round(cToF(t))}°F`;
    const formatted = [
      description,
      temp !== null ? formatTemp(temp) : null,
      feelsLike !== null && feelsLike !== temp ? `(Feels like ${formatTemp(feelsLike)})` : null
    ].filter(Boolean).join(', ');
    console.log("Temp:", temp, "Heat Index:", props.heatIndex?.value, "Wind Chill:", props.windChill?.value);

    const time = updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    document.getElementById("current-conditions").innerHTML = `
      ${formatted}<br>
      <span class="updated-time">Updated at ${time}</span>
    `;
  } catch (err) {
    console.warn("Could not load current conditions:", err);
    document.getElementById("current-conditions").textContent = "";
  }
}

function cToF(celsius) {
  return (celsius * 9) / 5 + 32;
}

window.copyForecast = function () {
  const forecastEl = document.getElementById("forecast");
  if (!forecastEl) return;

  const lines = [];

  Array.from(forecastEl.children).forEach(item => {
    const boldEl = item.querySelector("b");
    let label = "";
    let description = "";

    if (boldEl) {
      label = boldEl.textContent.trim().replace(/:$/, "");

      // Collect everything *after* the bold element
      let contentParts = [];
      let currentNode = boldEl.nextSibling;

      while (currentNode) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          contentParts.push(currentNode.textContent.trim());
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          contentParts.push(currentNode.textContent.trim());
        }
        currentNode = currentNode.nextSibling;
      }

      description = contentParts.join(" ").replace(/\s+/g, " ").trim();
      lines.push(`${label}: ${description}`);
    } else {
      // No bold element, just use the whole text
      const raw = item.textContent.trim().replace(/\s+/g, " ");
      if (raw) lines.push(raw);
    }
  });

  const finalText = lines.join("\n");

  navigator.clipboard.writeText(finalText)
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Forecast text copied to clipboard.',
        timer: 1500,
        showConfirmButton: false
      });
    })
    .catch(err => {
      console.error("Failed to copy forecast:", err);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Could not copy forecast. Try again.',
      });
    });
};

window.copyAlerts = function () {
  const alertsEl = document.getElementById("alerts");
  if (!alertsEl) return;

  // Grab all alert blocks (assuming each alert is in its own child div)
  const alertItems = Array.from(alertsEl.children);
  const lines = [];

  alertItems.forEach(item => {
    const text = item.innerText.trim().replace(/\s+/g, " ");
    if (text) lines.push(text);
  });

  if (lines.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'No Alerts',
      text: 'There are no active alerts to copy.',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  const finalText = lines.join("\n\n"); // Separate alerts with double newlines

  navigator.clipboard.writeText(finalText)
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Active alerts copied to clipboard.',
        timer: 1500,
        showConfirmButton: false
      });
    })
    .catch(err => {
      console.error("Failed to copy alerts:", err);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Could not copy alerts. Try again.',
      });
    });
};
