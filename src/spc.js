// spc.js

export function openSpcWindow(day) {
    const links = {
        day1: 'https://www.spc.noaa.gov/products/outlook/day1otlk.html',
        day2: 'https://www.spc.noaa.gov/products/outlook/day2otlk.html',
        day3: 'https://www.spc.noaa.gov/products/outlook/day3otlk.html',
    };

    const width = 1280;
    const height = 1024;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    window.open(
        links[day],
        `${day}SPCOutlook`,
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
}