// radar.js

let radarLayer = null;

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
