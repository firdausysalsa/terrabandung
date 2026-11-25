let map, basemaps = {}, activeBasemap;
let polygonLayer = L.layerGroup();
let labelLayer = L.layerGroup();
let activeMarkerLayer = L.layerGroup();
let weatherById = {};
let chartInstance = null;

let selectedKecId = 'cidadap';
let currentWeatherEffect = 'mist';

// Jam WIB Live
setInterval(() => {
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('live-clock').innerText = `${now} WIB`;
}, 1000);

// 1. Inisialisasi Peta Terang Kota Bandung
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

  // Tampilkan label nama kecamatan hanya saat zoom >= 12 agar tidak bertumpuk
  map.on('zoomend', () => {
    if (map.getZoom() >= 12) {
      if (!map.hasLayer(labelLayer)) map.addLayer(labelLayer);
    } else {
      if (map.hasLayer(labelLayer)) map.removeLayer(labelLayer);
    }
  });

  initWeatherCanvas();
  refreshAllData();
}

function resetMapView() {
  map.flyTo([-6.912, 107.642], 12, { duration: 1.0 });
}

function setBasemap(type) {
  map.removeLayer(activeBasemap);
  activeBasemap = basemaps[type];
  map.addLayer(activeBasemap);

  document.getElementById('base-color').className = type === 'color' ? 'pill-btn active' : 'pill-btn';
  document.getElementById('base-minimal').className = type === 'minimal' ? 'pill-btn active' : 'pill-btn';
}

// 2. Ambil Data Open-Meteo (forecast_days=2 agar grafik 12 jam selalu mulai dari jam sekarang)
async function fetchAllBandungWeather() {
  const lats = kecamatanBandungList.map(k => k.lat).join(',');
  const lngs = kecamatanBandungList.map(k => k.lng).join(',');
  const elevs = kecamatanBandungList.map(k => k.elevation).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&elevation=${elevs}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&timezone=Asia%2FJakarta&forecast_days=2`;

  const res = await fetch(url);
  const raw = await res.json();
  const list = Array.isArray(raw) ? raw : [raw];

  kecamatanBandungList.forEach((kec, idx) => {
    weatherById[kec.id] = list[idx];
  });
}

// Terjemahkan Kode Cuaca WMO Open-Meteo
function describeSky(code) {
  if (code === 0) return '☀️ Cerah';
  if (code <= 2) return '⛅ Cerah Berawan';
  if (code === 3) return '☁️ Mendung';
  if (code >= 45 && code <= 48) return '🌫️ Berkabut';
  if (code >= 51 && code <= 57) return '🌦️ Gerimis';
  if (code >= 61 && code <= 67) return '🌧️ Hujan';
  if (code >= 80 && code <= 82) return '🌧️ Hujan Lokal';
  if (code >= 95) return '⛈️ Hujan Petir';
  return '⛅ Berawan';
}

// 3. Evaluasi Status Cuaca & Warna Poligon
function getWeatherStatus(kec) {
  const w = weatherById[kec.id];
  const rain = w.current.precipitation || 0;
  const startIdx = getCurrentHourIndex(w.hourly.time);
  const prob = Math.max(...w.hourly.precipitation_probability.slice(startIdx, startIdx + 6));

  if (rain >= 4 || (rain >= 1.5 && kec.elevation < 690)) {
    return {
      level: 'SIAGA GENANGAN',
      code: 'alert',
      color: '#ef4444',
      pillBg: '#fee2e2',
      pillColor: '#b91c1c',
      advice: `Curah hujan tinggi di wilayah ${kec.name} (${kec.elevation} mdpl). Waspadai potensi genangan di sekitar ${kec.hotspot}.`,
      fx: 'rain'
    };
  }
  if (rain > 0.2 || prob >= 45) {
    return {
      level: 'WASPADA HUJAN',
      code: 'warn',
      color: '#f59e0b',
      pillBg: '#fef3c7',
      pillColor: '#b45309',
      advice: `Wilayah ${kec.name} berpotensi hujan ringan hingga sedang (peluang ${prob}%). Siapkan jas hujan bila melintasi ${kec.hotspot}.`,
      fx: 'rain'
    };
  }
  return {
    level: 'AMAN / KONDUSIF',
    code: 'safe',
    color: '#10b981',
    pillBg: '#d1fae5',
    pillColor: '#047857',
    advice: `Cuaca di wilayah ${kec.name} (${kec.elevation} mdpl) terpantau kondusif. Aktivitas luar ruang dan lalu lintas aman.`,
    fx: 'mist'
  };
}

// Cari indeks jam sekarang di waktu Jakarta (WIB)
function getCurrentHourIndex(timeArray) {
  try {
    const jakartaNow = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit'
    }).format(new Date()).replace(' ', 'T');

    const idx = timeArray.findIndex(t => t.startsWith(jakartaNow));
    return idx >= 0 ? idx : 0;
  } catch (e) {
    return 0;
  }
}

// 4. Render Poligon, Label Nama Wilayah, & Ringkasan Header
function renderMapPolygons() {
  polygonLayer.clearLayers();
  labelLayer.clearLayers();

  let safeCount = 0, warnCount = 0, alertCount = 0;

  bandungKecamatanGeoJSON.features.forEach(feature => {
    const kec = feature.properties;
    const w = weatherById[kec.id];
    const status = getWeatherStatus(kec);
    const isSel = kec.id === selectedKecId;

    if (status.code === 'safe') safeCount++;
    else if (status.code === 'warn') warnCount++;
    else alertCount++;

    const poly = L.geoJSON(feature, {
      style: {
        fillColor: status.color,
        weight: isSel ? 2.2 : 1,
        opacity: isSel ? 0.9 : 0.55,
        color: isSel ? '#0284c7' : '#475569',
        fillOpacity: isSel ? 0.28 : 0.14
      }
    }).addTo(polygonLayer);

    poly.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.32, weight: 2, color: '#0284c7', opacity: 0.9 });
    });
    poly.on('mouseout', function () {
      this.setStyle({
        fillOpacity: isSel ? 0.28 : 0.14,
        weight: isSel ? 2.2 : 1,
        color: isSel ? '#0284c7' : '#475569',
        opacity: isSel ? 0.9 : 0.55
      });
    });

    poly.on('click', () => selectKecamatan(kec.id, true));

    poly.bindTooltip(`
      <strong>${kec.name}</strong> (${kec.elevation} mdpl)<br>
      ${describeSky(w.current.weather_code)} • ${w.current.temperature_2m}°C<br>
      Hujan: ${w.current.precipitation} mm • ${status.level}
    `);

    // Label Teks Nama Kecamatan di Peta
    const textIcon = L.divIcon({
      className: '',
      html: `<div class="kec-map-label">${kec.name}</div>`,
      iconSize: [0, 0]
    });
    L.marker([kec.lat, kec.lng], { icon: textIcon, interactive: false }).addTo(labelLayer);
  });

  document.getElementById('sum-safe').innerText = `${safeCount} Aman`;
  document.getElementById('sum-warn').innerText = `${warnCount} Waspada`;
  document.getElementById('sum-alert').innerText = `${alertCount} Siaga`;
}

// 5. Pilih Wilayah & Perbarui Panel Kanan
function selectKecamatan(kecId, fly = true) {
  selectedKecId = kecId;
  const kec = kecamatanBandungList.find(k => k.id === kecId);
  const w = weatherById[kecId];
  const status = getWeatherStatus(kec);

  renderMapPolygons();
  activeMarkerLayer.clearLayers();

  const radarIcon = L.divIcon({
    className: 'radar-pin',
    html: `<div class="radar-ring" style="background:${status.color}; width:26px; height:26px;"></div><div style="background:${status.color}; width:11px; height:11px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.25);"></div>`,
    iconSize: [18, 18]
  });
  L.marker([kec.lat, kec.lng], { icon: radarIcon }).addTo(activeMarkerLayer);

  if (fly) {
    map.flyTo([kec.lat, kec.lng], 13.5, { duration: 1.1 });
  }

  currentWeatherEffect = status.fx;

  document.getElementById('panel-region-badge').innerText = `KOTA BANDUNG • WILAYAH ${kec.wilayah.toUpperCase()}`;
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

// 6. Grafik Prakiraan 12 Jam (Mulai dari Jam Sekarang)
function renderChart(name, hourly) {
  if (typeof Chart === 'undefined') return;
  const ctx = document.getElementById('weatherChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const startIdx = getCurrentHourIndex(hourly.time);
  const endIdx = startIdx + 12;

  document.getElementById('chart-title').innerText = `PRAKIRAAN 12 JAM — ${name.toUpperCase()}`;
  const labels = hourly.time.slice(startIdx, endIdx).map(t => t.split('T')[1]);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Suhu (°C)',
          data: hourly.temperature_2m.slice(startIdx, endIdx),
          borderColor: '#059669',
          backgroundColor: 'rgba(16, 185, 129, 0.14)',
          yAxisID: 'y',
          borderWidth: 2.5,
          pointRadius: 2.5,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Peluang Hujan (%)',
          data: hourly.precipitation_probability.slice(startIdx, endIdx),
          borderColor: '#0284c7',
          yAxisID: 'y1',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 2.5,
          tension: 0.4
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

// 7. Daftar Pencarian Wilayah
function filterQuickList() {
  const query = document.getElementById('search-kec').value.toLowerCase();
  const listEl = document.getElementById('quick-list');
  listEl.innerHTML = '';

  const filtered = kecamatanBandungList.filter(k =>
    k.name.toLowerCase().includes(query) || k.hotspot.toLowerCase().includes(query)
  );

  document.getElementById('kec-count').innerText = `${filtered.length} Wilayah`;

  filtered.forEach(kec => {
    const w = weatherById[kec.id];
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

// 8. Animasi Partikel Cuaca Halus
function initWeatherCanvas() {
  const canvas = document.getElementById('weather-canvas');
  const ctx = canvas.getContext('2d');
  const particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 64;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speedY: 0.8 + Math.random() * 2.8,
      speedX: -0.4 + Math.random() * 1.1,
      size: 2 + Math.random() * 2.5,
      alpha: 0.25 + Math.random() * 0.35
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      if (currentWeatherEffect === 'rain') {
        ctx.strokeStyle = `rgba(2, 132, 199, ${p.alpha + 0.15})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + 14);
        ctx.stroke();
        p.y += p.speedY * 2.5;
        p.x -= 1.2;
      } else {
        ctx.fillStyle = `rgba(14, 165, 233, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX * 0.65;
        p.y -= p.speedY * 0.22;
      }
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
    });
    requestAnimationFrame(animate);
  }
  animate();
}

async function refreshAllData() {
  await fetchAllBandungWeather();
  filterQuickList();
  selectKecamatan(selectedKecId, false);
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('last-updated').innerText = `Update: ${now} WIB`;
}

initMap();