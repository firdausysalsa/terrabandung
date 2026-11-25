let map, basemaps = {}, activeBasemap;
let polygonLayer = L.featureGroup();
let labelLayer = L.layerGroup();
let activeMarkerLayer = L.layerGroup();
let weatherById = {};
let chartInstance = null;

let selectedKecId = 'cidadap';
let activeStatusFilter = 'all';

const fallbackKecList = (typeof kecamatanBandungList !== 'undefined' && Array.isArray(kecamatanBandungList))
  ? kecamatanBandungList
  : [];

setInterval(() => {
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const clockEl = document.getElementById('live-clock');
  if (clockEl) clockEl.innerText = `${now} WIB`;
}, 1000);

function initMap() {
  const transparentTile = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  basemaps = {
    color: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri & Contributors',
      errorTileUrl: transparentTile,
      maxZoom: 18
    }),
    minimal: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri Light Gray',
      errorTileUrl: transparentTile,
      maxZoom: 16
    })
  };

  activeBasemap = basemaps.color;
  map = L.map('map', { center: [-6.912, 107.642], zoom: 12, layers: [activeBasemap] });

  polygonLayer.addTo(map);
  labelLayer.addTo(map);
  activeMarkerLayer.addTo(map);

  map.on('zoomend', () => {
    if (map.getZoom() >= 12) {
      if (!map.hasLayer(labelLayer)) map.addLayer(labelLayer);
    } else {
      if (map.hasLayer(labelLayer)) map.removeLayer(labelLayer);
    }
  });

  fallbackKecList.forEach(kec => {
    weatherById[kec.id] = createFallbackWeather(kec);
  });
  updateCityHighlights();
  filterQuickList();
  renderMapPolygons();

  refreshAllData();
}

function pickRandomKecamatan() {
  if (!fallbackKecList.length) return;
  const candidates = fallbackKecList.filter(k => k.id !== selectedKecId);
  const pool = candidates.length ? candidates : fallbackKecList;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  selectKecamatan(chosen.id, true);
}

function setStatusFilter(filterType) {
  activeStatusFilter = filterType;
  ['all', 'sunny', 'cloudy', 'rain'].forEach(t => {
    const btn = document.getElementById(`filter-${t}`);
    if (btn) btn.className = t === filterType ? 'pill-btn active' : 'pill-btn';
  });
  renderMapPolygons();
  filterQuickList();
}

function setBasemap(type) {
  if (!map || !basemaps[type]) return;
  map.removeLayer(activeBasemap);
  activeBasemap = basemaps[type];
  map.addLayer(activeBasemap);

  document.getElementById('base-color').className = type === 'color' ? 'pill-btn active' : 'pill-btn';
  document.getElementById('base-minimal').className = type === 'minimal' ? 'pill-btn active' : 'pill-btn';
}

function createFallbackWeather(kec) {
  const elev = kec.elevation || 700;
  const baseTemp = Number((26.5 - ((elev - 666) * 0.016)).toFixed(1));
  const now = new Date();
  const times = [];
  const temps = [];
  const probs = [];

  for (let i = 0; i < 48; i++) {
    const d = new Date(now.getTime() + (i - now.getHours()) * 3600000);
    const iso = d.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T').slice(0, 13) + ':00';
    times.push(iso);
    const h = d.getHours();
    const diurnal = Math.sin(((h - 6) / 24) * Math.PI * 2) * 2.8;
    temps.push(Number((baseTemp + diurnal).toFixed(1)));
    probs.push(h >= 13 && h <= 18 ? 35 : 15);
  }

  return {
    current: {
      temperature_2m: baseTemp,
      relative_humidity_2m: elev > 760 ? 78 : 71,
      precipitation: 0,
      weather_code: elev > 780 ? 2 : 1,
      wind_speed_10m: 6.5
    },
    hourly: {
      time: times,
      temperature_2m: temps,
      precipitation_probability: probs
    }
  };
}

async function fetchAllBandungWeather() {
  if (!fallbackKecList.length) return false;
  try {
    const lats = fallbackKecList.map(k => k.lat).join(',');
    const lngs = fallbackKecList.map(k => k.lng).join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&timezone=Asia%2FJakarta&forecast_days=2`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : [raw];

    fallbackKecList.forEach((kec, idx) => {
      const item = list[idx];
      if (item && item.current && item.hourly && Array.isArray(item.hourly.time)) {
        weatherById[kec.id] = item;
      } else {
        weatherById[kec.id] = createFallbackWeather(kec);
      }
    });
    return true;
  } catch (err) {
    fallbackKecList.forEach(kec => {
      weatherById[kec.id] = createFallbackWeather(kec);
    });
    return false;
  }
}

function describeSky(code) {
  if (code === 0) return '☀️ Cerah';
  if (code === 1) return '🌤️ Cerah Berawan';
  if (code === 2) return '⛅ Berawan Sebagian';
  if (code === 3) return '☁️ Mendung';
  if (code >= 45 && code <= 48) return '🌫️ Berkabut';
  if (code >= 51 && code <= 57) return '🌦️ Gerimis';
  if (code >= 61 && code <= 67) return '🌧️ Hujan';
  if (code >= 80 && code <= 82) return '🌧️ Hujan Lokal';
  if (code >= 95) return '⛈️ Hujan Petir';
  return '⛅ Berawan';
}

function getCurrentHourIndex(timeArray) {
  if (!Array.isArray(timeArray) || !timeArray.length) return 0;
  try {
    const jakartaNow = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit'
    }).format(new Date()).replace(' ', 'T');

    const idx = timeArray.findIndex(t => typeof t === 'string' && t.startsWith(jakartaNow));
    return idx >= 0 ? idx : 0;
  } catch (e) {
    return 0;
  }
}

// Evaluasi Status Cuaca Gabungan: Curah Hujan + Kondisi Langit (weather_code)
function getWeatherStatus(kec) {
  const w = weatherById[kec.id] || createFallbackWeather(kec);
  const rain = (w.current && typeof w.current.precipitation === 'number') ? w.current.precipitation : 0;
  const code = (w.current && typeof w.current.weather_code === 'number') ? w.current.weather_code : 1;
  const hourlyProb = (w.hourly && Array.isArray(w.hourly.precipitation_probability)) ? w.hourly.precipitation_probability : [];
  const startIdx = getCurrentHourIndex(w.hourly && w.hourly.time);
  const sliceProb = hourlyProb.slice(startIdx, startIdx + 6);
  const prob = sliceProb.length ? Math.max(...sliceProb) : 10;

  // 1. Siaga Genangan (Hujan lebat atau hujan di dataran rendah)
  if (rain >= 4 || (rain >= 1.5 && (kec.elevation || 700) < 690)) {
    return {
      level: 'SIAGA GENANGAN',
      code: 'alert',
      color: '#ef4444',
      pillBg: '#fee2e2',
      pillColor: '#b91c1c',
      advice: `Curah hujan tinggi di wilayah ${kec.name} (${kec.elevation} mdpl). Waspadai potensi genangan di sekitar ${kec.hotspot}.`
    };
  }

  // 2. Waspada Hujan (Gerimis/hujan aktual atau peluang hujan >= 50%)
  if (rain > 0.1 || code >= 51 || prob >= 50) {
    return {
      level: 'WASPADA HUJAN',
      code: 'rain',
      color: '#f59e0b',
      pillBg: '#fef3c7',
      pillColor: '#b45309',
      advice: `Wilayah ${kec.name} terpantau ${describeSky(code).toLowerCase()} (peluang hujan ${prob}%). Siapkan payung/jas hujan bila melintasi ${kec.hotspot}.`
    };
  }

  // 3. Berawan / Mendung (Tidak hujan, tapi langit tertutup awan / kabut)
  if (code >= 2 && code <= 48) {
    return {
      level: 'BERAWAN / TEDUH',
      code: 'cloudy',
      color: '#0ea5e9',
      pillBg: '#e0f2fe',
      pillColor: '#0369a1',
      advice: `Langit di ${kec.name} (${kec.elevation} mdpl) dalam kondisi ${describeSky(code).toLowerCase()} tanpa hujan. Nyaman untuk beraktivitas di luar ruangan.`
    };
  }

  // 4. Cerah / Kondusif (Langit cerah code 0 atau 1)
  return {
    level: 'CERAH / KONDUSIF',
    code: 'sunny',
    color: '#10b981',
    pillBg: '#d1fae5',
    pillColor: '#047857',
    advice: `Cuaca di wilayah ${kec.name} (${kec.elevation} mdpl) terpantau cerah dan kondusif. Jarak pandang dan lalu lintas di sekitar ${kec.hotspot} aman.`
  };
}

function matchesActiveFilter(statusCode) {
  if (activeStatusFilter === 'all') return true;
  if (activeStatusFilter === 'sunny') return statusCode === 'sunny';
  if (activeStatusFilter === 'cloudy') return statusCode === 'cloudy';
  if (activeStatusFilter === 'rain') return statusCode === 'rain' || statusCode === 'alert';
  return true;
}

function updateCityHighlights() {
  let coldest = null;
  let warmest = null;

  fallbackKecList.forEach(kec => {
    const w = weatherById[kec.id] || createFallbackWeather(kec);
    const t = w.current ? w.current.temperature_2m : 24;
    if (!coldest || t < coldest.temp) coldest = { name: kec.name, temp: t };
    if (!warmest || t > warmest.temp) warmest = { name: kec.name, temp: t };
  });

  const coolEl = document.getElementById('hl-cool');
  const warmEl = document.getElementById('hl-warm');
  if (coldest && coolEl) coolEl.innerHTML = `Terdingin: <strong>${coldest.name} (${coldest.temp}°C)</strong>`;
  if (warmest && warmEl) warmEl.innerHTML = `Terhangat: <strong>${warmest.name} (${warmest.temp}°C)</strong>`;
}

function renderMapPolygons() {
  if (typeof bandungKecamatanGeoJSON === 'undefined' || !bandungKecamatanGeoJSON.features) return;
  polygonLayer.clearLayers();
  labelLayer.clearLayers();

  bandungKecamatanGeoJSON.features.forEach(feature => {
    const kec = feature.properties;
    const w = weatherById[kec.id] || createFallbackWeather(kec);
    const status = getWeatherStatus(kec);
    const isSel = kec.id === selectedKecId;
    const isFilteredOut = !matchesActiveFilter(status.code);

    const poly = L.geoJSON(feature, {
      style: {
        fillColor: status.color,
        weight: isSel ? 2.2 : 1,
        opacity: isFilteredOut ? 0.2 : (isSel ? 0.9 : 0.55),
        color: isSel ? '#0f172a' : '#475569',
        fillOpacity: isFilteredOut ? 0.03 : (isSel ? 0.28 : 0.14)
      }
    }).addTo(polygonLayer);

    poly.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.32, weight: 2, color: '#0f172a', opacity: 0.9 });
    });
    poly.on('mouseout', function () {
      this.setStyle({
        fillOpacity: isFilteredOut ? 0.03 : (isSel ? 0.28 : 0.14),
        weight: isSel ? 2.2 : 1,
        color: isSel ? '#0f172a' : '#475569',
        opacity: isFilteredOut ? 0.2 : (isSel ? 0.9 : 0.55)
      });
    });

    poly.on('click', () => selectKecamatan(kec.id, true));

    poly.bindTooltip(`
      <strong>${kec.name}</strong> (${kec.elevation} mdpl)<br>
      ${describeSky(w.current.weather_code)} • ${w.current.temperature_2m}°C<br>
      Hujan: ${w.current.precipitation} mm • ${status.level}
    `);

    const textIcon = L.divIcon({
      className: '',
      html: `<div class="kec-map-label" style="opacity:${isFilteredOut ? '0.35' : '1'};">${kec.name}</div>`,
      iconSize: [0, 0]
    });
    L.marker([kec.lat, kec.lng], { icon: textIcon, interactive: false }).addTo(labelLayer);
  });
}

function selectKecamatan(kecId, fly = true) {
  if (!fallbackKecList.length) return;
  selectedKecId = kecId;
  const kec = fallbackKecList.find(k => k.id === kecId) || fallbackKecList[0];
  const w = weatherById[kec.id] || createFallbackWeather(kec);
  const status = getWeatherStatus(kec);

  renderMapPolygons();
  activeMarkerLayer.clearLayers();

  const pinIcon = L.divIcon({
    className: '',
    html: `<div style="background:${status.color}; width:11px; height:11px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.35);"></div>`,
    iconSize: [11, 11]
  });
  L.marker([kec.lat, kec.lng], { icon: pinIcon, interactive: false }).addTo(activeMarkerLayer);

  if (fly && map) {
    map.flyTo([kec.lat, kec.lng], 13.5, { duration: 0.9 });
  }

  document.getElementById('panel-region-badge').innerText = `KOTA BANDUNG • WILAYAH ${String(kec.wilayah || '').toUpperCase()}`;
  document.getElementById('panel-elev').innerText = `${kec.elevation} mdpl`;
  document.getElementById('panel-title').innerText = `Kec. ${kec.name}`;
  document.getElementById('panel-sky').innerText = describeSky(w.current.weather_code);
  document.getElementById('panel-subtitle').innerText = `Titik Pantau: ${kec.hotspot}`;

  const statusEl = document.getElementById('status-level');
  statusEl.innerText = status.level;
  statusEl.style.background = status.pillBg;
  statusEl.style.color = status.pillColor;
  document.getElementById('status-advice').innerText = status.advice;

  document.getElementById('metric-temp').innerText = `${w.current.temperature_2m} °C`;
  document.getElementById('metric-rain').innerText = `${w.current.precipitation} mm`;
  document.getElementById('metric-wind').innerText = `${w.current.wind_speed_10m} km/j`;
  document.getElementById('metric-humidity').innerText = `${w.current.relative_humidity_2m} %`;

  renderChart(kec.name, w.hourly);
}

function renderChart(name, hourly) {
  if (typeof Chart === 'undefined' || !hourly || !Array.isArray(hourly.time)) return;
  const canvasEl = document.getElementById('weatherChart');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const startIdx = getCurrentHourIndex(hourly.time);
  const endIdx = startIdx + 12;

  document.getElementById('chart-title').innerText = `PRAKIRAAN 12 JAM — ${String(name).toUpperCase()}`;
  const labels = hourly.time.slice(startIdx, endIdx).map(t => (typeof t === 'string' && t.includes('T')) ? t.split('T')[1] : t);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Suhu (°C)',
          data: (hourly.temperature_2m || []).slice(startIdx, endIdx),
          borderColor: '#059669',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          yAxisID: 'y',
          borderWidth: 2,
          pointRadius: 2.5,
          fill: true,
          tension: 0.35
        },
        {
          label: 'Peluang Hujan (%)',
          data: (hourly.precipitation_probability || []).slice(startIdx, endIdx),
          borderColor: '#0284c7',
          yAxisID: 'y1',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 2.5,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#334155', boxWidth: 10, font: { size: 11, weight: '600' } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(15, 23, 42, 0.05)' } },
        y: { position: 'left', ticks: { color: '#059669', font: { size: 10 } }, grid: { color: 'rgba(15, 23, 42, 0.06)' } },
        y1: { position: 'right', min: 0, max: 100, ticks: { color: '#0284c7', font: { size: 10 } }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function filterQuickList() {
  const inputEl = document.getElementById('search-kec');
  const listEl = document.getElementById('quick-list');
  const countEl = document.getElementById('kec-count');
  if (!listEl) return;

  const query = inputEl ? inputEl.value.toLowerCase().trim() : '';
  listEl.innerHTML = '';

  const filtered = fallbackKecList.filter(k => {
    const status = getWeatherStatus(k);
    const nameMatch = String(k.name || '').toLowerCase().includes(query);
    const spotMatch = String(k.hotspot || '').toLowerCase().includes(query);
    return (nameMatch || spotMatch) && matchesActiveFilter(status.code);
  });

  if (countEl) countEl.innerText = `${filtered.length} Wilayah`;

  filtered.forEach(kec => {
    const w = weatherById[kec.id] || createFallbackWeather(kec);
    const status = getWeatherStatus(kec);
    const item = document.createElement('div');
    item.className = 'quick-item';
    item.innerHTML = `
      <div>
        <strong style="display:block; color:#0f172a;">${kec.name} <span style="font-weight:500; color:#64748b;">(${kec.wilayah})</span></strong>
        <span style="font-size:10.5px; color:#64748b;">${kec.elevation} mdpl • ${w.current.temperature_2m}°C • Hujan ${w.current.precipitation} mm</span>
      </div>
      <span class="status-pill" style="background:${status.pillBg}; color:${status.pillColor};">${status.level}</span>
    `;
    item.onclick = () => selectKecamatan(kec.id, true);
    listEl.appendChild(item);
  });
}

async function refreshAllData() {
  const isLive = await fetchAllBandungWeather();
  updateCityHighlights();
  filterQuickList();
  selectKecamatan(selectedKecId, false);
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const updEl = document.getElementById('last-updated');
  if (updEl) updEl.innerText = isLive ? `Update: ${now} WIB` : `Data Elevasi: ${now} WIB`;
}

initMap();