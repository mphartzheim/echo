export function cToF(celsius) {
    return (celsius * 9) / 5 + 32;
  }
  
  // Fetch shared metadata once
  export async function fetchPointData(lat, lon) {
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    return response.json();
  }
  
  // Use pre-fetched point data to render header
  export async function updateForecastHeaderWithPointData(data) {
    try {
      const city = data.properties.relativeLocation.properties.city;
      const state = data.properties.relativeLocation.properties.state;
      const locationName = `${city}, ${state}`;
      document.getElementById("forecast-location").textContent = locationName;
    } catch (err) {
      console.warn('Could not extract location info:', err);
      document.getElementById("forecast-location").textContent = "";
    }
  }
  
  // Fetch station & latest observation faster using parallel fetches
  export async function updateCurrentConditionsWithPointData(pointsData) {
    try {
      const stationsUrl = pointsData.properties.observationStations;
  
      // Fetch stations
      const stationsResponse = await fetch(stationsUrl);
      const stationsData = await stationsResponse.json();
      const firstStation = stationsData.features[0]?.id;
      if (!firstStation) throw new Error("No stations found");
  
      // Fetch latest conditions from the first station
      const conditionsResponse = await fetch(`${firstStation}/observations/latest`);
      const { properties: props } = await conditionsResponse.json();
  
      const temp = props.temperature.value;
      const feelsLike = props.heatIndex?.value ?? props.windChill?.value ?? null;
      const description = props.textDescription;
      const updated = new Date(props.timestamp);
  
      const formatTemp = t => `${Math.round(cToF(t))}°F`;
      const formatted = [
        description,
        temp !== null ? formatTemp(temp) : null,
        feelsLike !== null && feelsLike !== temp ? `(Feels like ${formatTemp(feelsLike)})` : null
      ].filter(Boolean).join(', ');
  
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
  