// radar.js

let radarLayer = null;
let alertPolygonLayers = []; // Track alert polygon layers

export async function updateRadarLayer(map) {
    try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();

        const pastFrames = data.radar.past;
        const availableTimestamps = pastFrames.map(frame => frame.time).reverse();

        let workingTimestamp = null;

        for (const timestamp of availableTimestamps) {
            const testUrl = `https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/4/3/5/2/1_1.png`;
            const response = await fetch(testUrl, { method: 'HEAD' });
            if (response.ok) {
                workingTimestamp = timestamp;
                break;
            }
        }

        if (!workingTimestamp) {
            console.warn("No working radar frame found.");
            return;
        }

        if (radarLayer) {
            map.removeLayer(radarLayer);
        }

        radarLayer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${workingTimestamp}/256/{z}/{x}/{y}/2/1_1.png`, {
            opacity: 0.6,
            maxZoom: 12,
            attribution: 'Radar &copy; RainViewer.com'
        });

        radarLayer.addTo(map);
        console.log("Radar layer added with working timestamp:", workingTimestamp);
    } catch (error) {
        console.error("Error loading radar layer:", error);
    }
}

// Function to display alert polygons on the map
export function displayAlertPolygons(map, alerts) {
    // Clear existing alert polygons
    if (alertPolygonLayers.length > 0) {
        alertPolygonLayers.forEach(layer => map.removeLayer(layer));
        alertPolygonLayers = [];
    }

    // If no alerts, exit early
    if (!alerts || alerts.length === 0) {
        // Remove legend if it exists
        const existingLegend = document.getElementById('alert-legend');
        if (existingLegend) {
            existingLegend.remove();
        }
        return;
    }

    // Process each alert
    alerts.forEach(alert => {
        // Check if the alert is a warning (not a watch)
        const isWarning = alert.properties &&
            alert.properties.event &&
            alert.properties.event.toLowerCase().includes('warning') &&
            !alert.properties.event.toLowerCase().includes('watch');

        // Only display polygons for warnings
        if (isWarning && alert.geometry && alert.geometry.type === 'Polygon') {
            addPolygonToMap(map, alert);
        }
    });

    // Add or update legend if we have any displayed polygons
    if (alertPolygonLayers.length > 0) {
        createAlertLegend(map);
    } else {
        // Remove legend if no polygons are displayed
        const existingLegend = document.getElementById('alert-legend');
        if (existingLegend) {
            existingLegend.remove();
        }
    }
}

// Helper function to add a polygon to the map
function addPolygonToMap(map, alert) {
    try {
        // Convert coordinates to Leaflet format [lat, lng]
        // NWS API uses GeoJSON format which is [lng, lat]
        const coordinates = alert.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

        // Determine color based on alert properties
        const color = getAlertColor(alert.properties.severity);

        // Create and add the polygon
        const polygon = L.polygon(coordinates, {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2
        }).addTo(map);

        // Add popup with alert information
        polygon.bindPopup(`
            <strong>${alert.properties.headline || 'Weather Alert'}</strong><br>
            ${alert.properties.description ? alert.properties.description.substring(0, 200) + '...' : ''}
            <br><small>Source: ${alert.properties.senderName || 'NWS'}</small>
        `);

        // Track this layer so we can remove it later
        alertPolygonLayers.push(polygon);
    } catch (error) {
        console.error('Error adding alert polygon to map:', error);
    }
}

// Helper function to determine alert color based on severity
function getAlertColor(severity) {
    switch (severity) {
        case 'Extreme':
            return '#ff0000'; // Red
        case 'Severe':
            return '#ff6600'; // Orange
        case 'Moderate':
            return '#ffcc00'; // Yellow
        case 'Minor':
            return '#ffff00'; // Light Yellow
        default:
            return '#3388ff'; // Default blue
    }
}

// Create a legend for alert colors
function createAlertLegend(map) {
    // Remove existing legend if it exists
    const existingLegend = document.getElementById('alert-legend');
    if (existingLegend) {
        existingLegend.remove();
    }

    // Create legend container
    const legend = document.createElement('div');
    legend.id = 'alert-legend';
    legend.style.cssText = `
        position: absolute;
        bottom: 30px;
        right: 10px;
        z-index: 1000;
        background: white;
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
        font-size: 12px;
        box-shadow: 0 1px 5px rgba(0,0,0,0.4);
    `;

    // Add title
    const title = document.createElement('div');
    title.textContent = 'Alert Severity';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    legend.appendChild(title);

    // Add legend items
    const severities = [
        { level: 'Extreme', color: '#ff0000' },
        { level: 'Severe', color: '#ff6600' },
        { level: 'Moderate', color: '#ffcc00' },
        { level: 'Minor', color: '#ffff00' },
        { level: 'Unknown', color: '#3388ff' }
    ];

    severities.forEach(item => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '2px';

        const colorBox = document.createElement('span');
        colorBox.style.cssText = `
            display: inline-block;
            width: 15px;
            height: 15px;
            margin-right: 5px;
            background-color: ${item.color};
            border: 1px solid #666;
        `;

        const label = document.createElement('span');
        label.textContent = item.level;

        row.appendChild(colorBox);
        row.appendChild(label);
        legend.appendChild(row);
    });

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        margin-top: 5px;
        padding: 2px 5px;
        font-size: 11px;
        cursor: pointer;
    `;
    closeButton.onclick = function (event) {
        // Stop event propagation to prevent map click
        event.stopPropagation();
        legend.remove();
    };
    legend.appendChild(closeButton);

    // Add legend to map container
    document.querySelector('#map').appendChild(legend);

    // Apply dark mode if active
    if (document.body.classList.contains('dark-mode')) {
        legend.style.backgroundColor = '#333';
        legend.style.color = '#fff';
        legend.style.borderColor = '#666';
    }
}
