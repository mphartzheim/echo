// search.js

export async function searchLocation(map, currentMarkerRef, setSelectedLocation, renderForecast, renderAlerts, updateHeader, updateConditions) {
  const input = document.getElementById('locationSearch');
  const query = input.value.trim();
  if (!query) return;

  // Store the input value to possibly restore focus later
  const originalValue = input.value;

  const forecastDiv = document.getElementById('forecast');
  const alertsDiv = document.getElementById('alerts');

  // Create or grab the spinner.
  let spinner = document.getElementById('forecast-loading');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'forecast-loading';
    spinner.classList.add('spinner', 'hidden');
    forecastDiv.prepend(spinner);
  }

  // Clear forecastDiv while preserving the spinner.
  Array.from(forecastDiv.children).forEach(child => {
    if (child.id !== 'forecast-loading') {
      child.remove();
    }
  });
  // Clear alerts.
  alertsDiv.innerHTML = '';

  // Show the spinner.
  spinner.classList.remove("hidden");

  // Process the search query to check for US state codes
  let url;
  const usStateRegex = /,\s*([A-Z]{2})$/; // Match ", XX" at the end of string where XX is two uppercase letters
  const stateMatch = query.match(usStateRegex);

  if (stateMatch) {
    // If we found a potential US state code, prioritize US results
    url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`;
  } else {
    // Otherwise use the standard search
    url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      // For US state searches, try to find a result that matches the state code
      let resultIndex = 0;
      if (stateMatch) {
        const stateCode = stateMatch[1];
        // Look for the first result that has the state code in its display_name
        const matchingIndex = data.findIndex(item =>
          item.display_name.includes(`, ${stateCode},`) ||
          item.display_name.endsWith(`, ${stateCode}`)
        );
        if (matchingIndex !== -1) {
          resultIndex = matchingIndex;
        }
      }

      const lat = parseFloat(data[resultIndex].lat);
      const lon = parseFloat(data[resultIndex].lon);
      setSelectedLocation(lat, lon);

      map.setView([lat, lon], 10);
      if (currentMarkerRef.value) {
        map.removeLayer(currentMarkerRef.value);
      }
      currentMarkerRef.value = L.marker([lat, lon]).addTo(map);

      await new Promise(resolve => setTimeout(resolve, 0));

      const weatherForecast = await window.api.fetchWeather(lat, lon);
      const activeAlerts = await window.api.fetchAlerts(lat, lon);

      // Display alert polygons on the map
      await import('./radar.js').then(module => {
        module.displayAlertPolygons(map, activeAlerts);
      });

      await updateHeader(lat, lon);
      await updateConditions(lat, lon);

      renderForecast(forecastDiv, weatherForecast);
      renderAlerts(alertsDiv, activeAlerts);
    } else {
      // Show the alert
      alert("Location not found.");

      // Use setTimeout to delay the focus restoration until after the alert is dismissed
      setTimeout(() => {
        // Clear the input and re-focus
        input.value = '';
        input.blur(); // First remove focus
        input.focus(); // Then try to focus again

        // Force the input to be enabled and interactive
        input.readOnly = false;
        input.disabled = false;
        input.style.pointerEvents = 'auto';
      }, 100); // Short delay to ensure the alert is fully dismissed
    }
  } catch (err) {
    console.error('Error searching location:', err);
    alert("Error searching for location.");

    // Use setTimeout to delay the focus restoration until after the alert is dismissed
    setTimeout(() => {
      // Clear the input and re-focus
      input.value = '';
      input.blur(); // First remove focus
      input.focus(); // Then try to focus again

      // Force the input to be enabled and interactive
      input.readOnly = false;
      input.disabled = false;
      input.style.pointerEvents = 'auto';
    }, 100); // Short delay to ensure the alert is fully dismissed
  } finally {
    spinner.classList.add("hidden");
  }
}
