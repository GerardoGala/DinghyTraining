// js/wind.js

// Permanent training wind
export let baseWindSpeedMS = 3.6; // 7 knots

const WIND_DIRECTION = 0;          // 0° = North
const WIND_SPEED_KNOTS = 7.0;      // permanent 7 knots


/**
 * Start the permanent training wind.
 */
export function fetchWind() {

    // Initialize global simulation data
    window.globalSimulationData = window.globalSimulationData || {};

    window.globalSimulationData.windDirection = WIND_DIRECTION;
    window.globalSimulationData.windSpeed = WIND_SPEED_KNOTS;

    // Update the display immediately
    updateWindDisplay();

    // No need for a continuously changing wind simulation.
}


/**
 * Update the wind display.
 */
function updateWindDisplay() {

    const windDiv = document.getElementById("windStatus");

    if (windDiv) {
        windDiv.textContent =
            `🌬️ Wind: ${WIND_SPEED_KNOTS} knots from ${WIND_DIRECTION}°`;
    }
}