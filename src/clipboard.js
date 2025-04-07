// clipboard.js

export function copyForecastLimited(limit) {
    const forecastEl = document.getElementById("forecast");
    if (!forecastEl) return;

    const lines = [];

    Array.from(forecastEl.children).slice(0, limit * 2 + 2).forEach(item => {
        const boldEl = item.querySelector("b");
        let label = "";
        let description = "";

        if (boldEl) {
            label = boldEl.textContent.trim().replace(/:$/, "");

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
                text: `Copied ${limit}-day forecast to clipboard.`,
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
}

export function copyAlerts() {
    const alertsEl = document.getElementById("alerts");
    if (!alertsEl) return;

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

    const finalText = lines.join("\n\n");

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
}
