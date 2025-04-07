// render.js

export function renderForecastToContainer(container, forecast) {
    if (!forecast?.length) return;

    const forecastHtml = forecast.map(p => `
      <div>
        <strong>${p.name}:</strong>
        <p>${p.detailedForecast}</p>
      </div>
    `).join('');

    container.insertAdjacentHTML('beforeend', `<h3>🌤️ 7-Day Forecast</h3>${forecastHtml}`);
}

export function renderAlertsToContainer(container, alerts) {
    if (!alerts?.length) return;

    const alertsHtml = alerts.map(alert => `
      <div>
        <strong>${alert.properties.headline}</strong>
        <p>${alert.properties.description}</p>
      </div>
    `).join('');

    container.innerHTML = `<h3>Active Alerts</h3>${alertsHtml}`;
}
