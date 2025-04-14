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

## 🛠️ Development

### Building the Application

You can build the application for your current platform using:

```bash
npm run build
```

To build for specific platforms:

```bash
# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux

# Build for both Windows and Linux
npm run build:all
```

### Release Process

The release process is automated with scripts that handle version bumping, changelog generation, and building the application.

To create a new release:

```bash
npm run release
```

This interactive script will:
1. Check for uncommitted changes
2. Prompt for release type (patch, minor, major)
3. Bump the version in package.json
4. Update the CHANGELOG.md file
5. Commit the changes and create a git tag
6. Build the application for selected platforms
7. Optionally push the changes to GitHub

#### Manual Steps

You can also perform these steps manually:

```bash
# Bump version (patch, minor, or major)
npm run version:bump [patch|minor|major]

# Update changelog
npm run changelog

# Build for all platforms
npm run build:all
```

### Continuous Integration

This project uses GitHub Actions for CI/CD:

- **CI Workflow**: Runs on every push to main branch and pull requests
- **Release Workflow**: Triggered when a new tag is pushed, builds and creates a GitHub Release