# 🌦️ Echo Location WX

[![Latest release](https://img.shields.io/github/v/release/mphartzheim/echo?include_prereleases)](https://github.com/mphartzheim/echo/releases)
[![Electron](https://img.shields.io/badge/Electron-%5E25.3.0-blue.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)

**Echo Location WX** is a sleek, cross-platform desktop weather app that provides real-time forecasts, alerts, and radar links for any clicked location on the map. Built with Electron, Leaflet, and NWS APIs, it’s fast, informative, and customizable — a weather dashboard built for power users and casual browsers alike.

![Echo Location WX Banner](assets/images/Echo_Location_WX_2_white.png)

## 🚀 Features

- 📍 **Click-to-Fetch Forecasts:** Click any location on the map to view current conditions and a full 7-day forecast.
- ⚠️ **Active Weather Alerts:** Pulls NWS active alerts for the selected location.
- 📌 **Pin Favorite Locations:** Save your favorite spots and quickly switch between them.
- 📅 **Forecast Copy Buttons:** Instantly copy the full, 3-day, or 5-day forecast to your clipboard.
- 🌒 **Dark Mode:** Toggle between light and dark themes with one click.
- 🌐 **Radar Quick Links:** One-click buttons to view SPC outlooks for Day 1, 2, or 3 in a new tab.

## 🧱 Built With

- [Electron](https://www.electronjs.org/) – Desktop framework
- [Leaflet](https://leafletjs.com/) – Map rendering
- [National Weather Service API](https://www.weather.gov/documentation/services-web-api) – Forecasts & alerts
- [SweetAlert2](https://sweetalert2.github.io/) – Pop-up messages
- HTML5, CSS3, JavaScript (with ES Modules)

## 🖥️ App Layout

- **Left Panel:** Favorite/pinned locations and search.
- **Center Panel:** Interactive Leaflet map.
- **Right Panel:** Forecast display with copy options.
- **Bottom Panel:** Active alerts for the selected location.