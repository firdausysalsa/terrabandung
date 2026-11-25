# TerraBandung — WebGIS Cuaca Mikro & Mitigasi 30 Kecamatan Kota Bandung

**TerraBandung** adalah aplikasi Sistem Informasi Geografis berbasis web (_WebGIS_) yang memetakan kondisi atmosfer _real-time_ dan prakiraan cuaca mikro di seluruh **30 Kecamatan Kota Bandung** menggunakan **Open-Meteo API**.

## Fitur Utama & Analisis SIG

1. **Pemetaan Choropleth 30 Kecamatan Kota Bandung:**
   - Poligon seluruh 30 kecamatan yang diwarnai dinamis berdasarkan 3 mode layer tematik: **Risiko Genangan**, **Suhu Mikro (Termal)**, dan **Kecepatan Angin**.
   - Menggunakan parameter koordinat pusat dan ketinggian (`elevation`) tiap kecamatan agar variasi suhu dataran tinggi (Bandung Utara) dan dataran rendah (Bandung Timur/Selatan) terhitung presisi.
2. **Komparasi Cuaca Antar-Kecamatan (_Side-by-Side Comparison_):**
   - Membandingkan langsung parameter elevasi, suhu aktual, curah hujan, kecepatan angin, serta grafik tren suhu 12 jam antara dua kecamatan pilihan.
3. **Ringkasan Ekstrem Kota & Direktori Wilayah:**
   - Otomatis mendeteksi kecamatan terdingin, terhangat, dan bercurah hujan tertinggi di Kota Bandung secara _real-time_, dilengkapi pencarian dan filter wilayah (Utara, Selatan, Timur, Barat, Tengah).

## Teknologi

- **Frontend & Spasial:** HTML5, CSS3, Vanilla JavaScript, Leaflet.js, OpenStreetMap
- **Data Cuaca:** [Open-Meteo Weather Forecast API](https://open-meteo.com/)
- **Visualisasi Grafik:** Chart.js