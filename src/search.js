// search.js

export async function searchLocation(map, currentMarkerRef, setSelectedLocation, renderForecast, renderAlerts, updateHeader, updateConditions) {
    const input = document.getElementById('locationSearch');
    const query = input.value.trim();
    if (!query) return;
  
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
  
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSelectedLocation(lat, lon);
  
        map.setView([lat, lon], 10);
        if (currentMarkerRef.value) {
          map.removeLayer(currentMarkerRef.value);
        }
        currentMarkerRef.value = L.marker([lat, lon]).addTo(map);
  
        await new Promise(resolve => setTimeout(resolve, 0));
  
        const weatherForecast = await window.api.fetchWeather(lat, lon);
        const activeAlerts = await window.api.fetchAlerts(lat, lon);
  
        await updateHeader(lat, lon);
        await updateConditions(lat, lon);
  
        renderForecast(forecastDiv, weatherForecast);
        renderAlerts(alertsDiv, activeAlerts);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error('Error searching location:', err);
      alert("Error searching for location.");
    } finally {
      spinner.classList.add("hidden");
    }
  }
  