export async function fetchNWWSAlerts() {
    const feedUrl = "https://nwws-oi.weather.gov/cap/us.php?x=0";
    try {
      const response = await fetch(feedUrl);
      const text = await response.text();
      return text;
    } catch (error) {
      console.error("Failed to fetch NWWS alerts:", error);
      return null;
    }
  }
  