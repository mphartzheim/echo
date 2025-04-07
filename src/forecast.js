// forecast.js

export async function updateForecastHeaderWithLocation(lat, lon) {
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

export async function updateCurrentConditions(lat, lon) {
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

export function cToF(celsius) {
    return (celsius * 9) / 5 + 32;
}
