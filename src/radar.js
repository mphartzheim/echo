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
        const color = getAlertColor(alert.properties.severity, alert);

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

// Helper function to determine alert color based on NWS official color codes
function getAlertColor(severity, alert) {
    // If we have the event type, use that for more specific coloring
    if (alert && alert.properties && alert.properties.event) {
        const eventType = alert.properties.event.toLowerCase();

        // Using official NWS color codes: https://www.weather.gov/help-map/
        if (eventType.includes('tornado')) {
            return '#FF0000'; // Red for Tornado Warning
        } else if (eventType.includes('flash flood')) {
            return '#00FF00'; // Green for Flash Flood Warning
        } else if (eventType.includes('flood')) {
            return '#00FF00'; // Green for Flood Warning
        } else if (eventType.includes('severe thunderstorm')) {
            return '#FFA500'; // Orange for Severe Thunderstorm Warning
        } else if (eventType.includes('winter storm')) {
            return '#FF69B4'; // Pink for Winter Storm Warning
        } else if (eventType.includes('blizzard')) {
            return '#FF69B4'; // Pink for Blizzard Warning
        } else if (eventType.includes('ice storm')) {
            return '#FF69B4'; // Pink for Ice Storm Warning
        } else if (eventType.includes('winter weather')) {
            return '#00FFFF'; // Cyan for Winter Weather Advisory
        } else if (eventType.includes('frost') || eventType.includes('freeze')) {
            return '#6495ED'; // Cornflower Blue for Frost/Freeze Warning
        } else if (eventType.includes('heat')) {
            return '#8B0000'; // Dark Red for Heat Warning
        } else if (eventType.includes('dense fog')) {
            return '#808080'; // Gray for Dense Fog Warning
        } else if (eventType.includes('special marine')) {
            return '#800080'; // Purple for Special Marine Warning
        } else if (eventType.includes('hurricane')) {
            return '#FF00FF'; // Magenta for Hurricane Warning
        } else if (eventType.includes('typhoon')) {
            return '#FF00FF'; // Magenta for Typhoon Warning
        } else if (eventType.includes('tropical storm')) {
            return '#9370DB'; // Medium Purple for Tropical Storm Warning
        } else if (eventType.includes('extreme wind')) {
            return '#CD853F'; // Peru for Extreme Wind Warning
        } else if (eventType.includes('dust')) {
            return '#8B4513'; // Saddle Brown for Dust Storm Warning
        }
    }

    // Fallback to severity-based coloring for any unmatched event types
    switch (severity) {
        case 'Extreme':
            return '#FF00FF'; // Magenta
        case 'Severe':
            return '#FF0000'; // Red
        case 'Moderate':
            return '#FFA500'; // Orange
        case 'Minor':
            return '#FFFF00'; // Yellow
        default:
            return '#1E90FF'; // Dodger Blue
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
    title.textContent = 'Warning Types';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    legend.appendChild(title);

    // Add legend items using official NWS colors
    const warningTypes = [
        { level: 'Tornado', color: '#FF0000' },
        { level: 'Severe Thunderstorm', color: '#FFA500' },
        { level: 'Flash Flood/Flood', color: '#00FF00' },
        { level: 'Winter Storm/Blizzard', color: '#FF69B4' },
        { level: 'Marine', color: '#800080' },
        { level: 'Hurricane/Typhoon', color: '#FF00FF' },
        { level: 'Tropical Storm', color: '#9370DB' },
        { level: 'Other Warnings', color: '#1E90FF' }
    ];

    warningTypes.forEach(item => {
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
