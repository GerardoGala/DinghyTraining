// map.js
let windControlDiv; // keep reference so we can update later
let ilcaControlDiv; // keep reference so we can update later


// Helper function to format raw seconds into MM:SS format
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function initMap() {
  const leewardMarkLat = window.globalSimulationData.leewardMarkLat;
  const leewardMarkLon = window.globalSimulationData.leewardMarkLon;
  const windwardMarkLat = window.globalSimulationData.windwardMarkLat;
  const windwardMarkLon = window.globalSimulationData.windwardMarkLon;
  const gybeMarkLat = window.globalSimulationData.gybeMarkLat;
  const gybeMarkLon = window.globalSimulationData.gybeMarkLon;

  const buoySVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="yellow" stroke="orange" stroke-width="4"/>
      <circle cx="24" cy="24" r="8" fill="orange" opacity="0.6"/>
    </svg>
  `;

  const buoyIcon = L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(buoySVG),
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Adjusted anchor point to center the 20x20 marker over 
    popupAnchor: [0, -10]
  });


// =========================================================================
// 🟢 STREAMLINED STATIC GREEN TARGET GLOW (No Flashing)
// =========================================================================

// A clean, solid green circle with a soft outer frame (40px wide)
const greenTargetSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#00FF00" opacity="0.4" stroke="#00CC00" stroke-width="2"/></svg>';


const greenTargetIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(greenTargetSVG),
  iconSize: [48, 48],      // 📐 Made bigger (Full 48x48 screen area)
  iconAnchor: [24, 24],    // 🎯 Dead center midpoint alignment (48 / 2)
  popupAnchor: [0, -24]
});


  const map = L.map('map', {
    center: [windwardMarkLat, windwardMarkLon],
    zoom: 16,
    dragging: false,        
    zoomControl: false,     
    scrollWheelZoom: false, 
    doubleClickZoom: false, 
    touchZoom: false        
  });

  


  // Add scale control to show distances on the map
  L.control.scale({
    position: 'bottomleft', 
    imperial: false,        
    metric: true            
  }).addTo(map);

  // --- topleft ---
  const TopLeftControls = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'top-left-controls-container');
      
      // Stop map click/scroll events from bleeding through the panel
      L.DomEvent.disableClickPropagation(container);

      // Wind Indicator
      windControlDiv = L.DomUtil.create('div', 'wind-indicator-container', container);
      windControlDiv.style.background = 'white';
      windControlDiv.style.padding = '8px';
      windControlDiv.style.borderRadius = '5px';
      windControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      windControlDiv.style.textAlign = 'center';
      windControlDiv.style.fontFamily = 'sans-serif';
      windControlDiv.style.fontSize = '12px';
      windControlDiv.style.fontWeight = 'bold';
      windControlDiv.style.color = '#222';
      windControlDiv.style.marginBottom = '8px'; // Adds vertical spacing between panels
      updateWindControl(map);

      // --- ILCA Status + Time ---
      ilcaControlDiv = L.DomUtil.create('div', 'ilca-status-container', container);
      ilcaControlDiv.style.background = 'white';
      ilcaControlDiv.style.padding = '8px';
      ilcaControlDiv.style.borderRadius = '5px';
      ilcaControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      ilcaControlDiv.style.textAlign = 'center';
      ilcaControlDiv.style.fontFamily = 'sans-serif';
      ilcaControlDiv.style.fontSize = '12px';
      ilcaControlDiv.style.lineHeight = '1.4em';
      ilcaControlDiv.style.color = '#222';
      ilcaControlDiv.style.fontWeight = 'bold'; 
      updateILCAControl(map);


      return container;
    }
  });

  // Render custom control group onto the UI
  map.addControl(new TopLeftControls());

  // Define bounds safely encompassing all three active race marks
  const bounds = L.latLngBounds([
    [windwardMarkLat, windwardMarkLon],
    [gybeMarkLat, gybeMarkLon],
    [leewardMarkLat, leewardMarkLon]
  ]);
  map.fitBounds(bounds, { padding: [50, 50] });

  return map;
}

// --- Refresh function to update wind arrow dynamically ---
export function updateWindControl(map) {
  if (!windControlDiv) return;

  const windDir = window.globalSimulationData.windDirection || 0;
  const windSpeed = Number(window.globalSimulationData.windSpeed)?.toFixed(1) || "0.0";
  windControlDiv.innerHTML = `
    <div style="margin-bottom: 4px;">WIND</div>
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${windDir}, 25, 25)">
        <line x1="25" y1="5" x2="25" y2="40" stroke="blue" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,45 20,35 30,35" fill="blue" />
      </g>
    </svg>
    <div style="margin-top: 4px; color: blue;">
      ${windDir}° at ${windSpeed} kn
    </div>
  `;
}


// --- Refresh function to update ILCA status + time ---
export function updateILCAControl() {
  if (!ilcaControlDiv) return;
  if (window.globalSimulationData.raceFinished) return; 

  const ilca = window.globalSimulationData.ILCA || {};
  const speedKnots = ilca.speed?.toFixed(1) || 0;
  const speedMS = (ilca.speed ? (ilca.speed * 0.514).toFixed(2) : "0.00");
  const heading = ilca.heading?.toFixed(0) || 0;
  const pointOfSail = ilca.pointOfSail || "Unknown";
  
  // ✅ CALCULATED DISPLAY: Convert the raw numerical timer to MM:SS string here
  const timer = formatTime(ilca.timer);
 
  // ✅ PURE DISPLAY: Fetch values directly from the stored simulation object
  const uiRotation = ilca.clinometer || 0;
  const absoluteHeel = Math.abs(uiRotation);

  // Set visual alert gauge color thresholds purely from raw values
  let needleColor = "#38bdf8"; // Safe Blue Zone
  if (absoluteHeel >= 38) {
    needleColor = "#ef4444";   // Danger Red Zone
  } else if (absoluteHeel >= 25) {
    needleColor = "#f59e0b";   // Caution Orange Zone
  }

  ilcaControlDiv.innerHTML = `
    <div><strong>ILCA Status</strong></div>
    <svg xmlns="http://w3.org" width="50" height="50" viewBox="0 0 50 50" style="margin:4px 0;">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${Number(heading)}, 25, 25)">
        <line x1="25" y1="45" x2="25" y2="10" stroke="red" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,5 20,15 30,15" fill="red" />
      </g>
    </svg>
    <div>Heading: ${heading}°</div>
    <div>Point of Sail: ${pointOfSail}</div>
    <div>Speed: ${speedKnots} knots (${speedMS} m/s)</div>
    <div>Timer: ${timer}</div>

<!-- --- PURE VIEW RETRO CLINOMETER DISPLAY --- -->
<div id="clinometerBox" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; margin-top: 8px; text-align: center; color: #1e293b; font-family: sans-serif;">
    <div style="font-size: 11px; letter-spacing: 0.5px; color: #475569; font-weight: bold; margin-bottom: 6px; font-family: sans-serif;">HEEL CLINOMETER</div>
    
    <div style="position: relative; width: 100px; height: 50px; border: 1px solid #cbd5e1; border-radius: 50px 50px 0 0; background: #f8fafc; margin: 0 auto; overflow: hidden;">
        <div style="position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; text-align: center; font-size: 8px; color: #94a3b8; bottom: 1px;">
            45° [ 0° ] 45°
        </div>

        <!-- Needle transforms react strictly to pre-calculated state variables -->
        <div style="position: absolute; left: 50%; bottom: 0; width: 2px; height: 42px; background: ${needleColor}; transform-origin: bottom center; transform: translateX(-50%) rotate(${uiRotation}deg); transition: transform 0.2s ease-out;">
            <div style="position: absolute; top: 0; left: -2px; width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></div>
        </div>
    </div>

    <div style="margin-top: 6px; font-size: 12px; font-weight: bold; color: #000000;">
        Angle: <span style="color: ${needleColor};">${Math.round(absoluteHeel)}°</span>
    </div>
</div>

  `;
}









