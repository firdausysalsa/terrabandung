// Batas Luar Wilayah Administrasi Kota Bandung (Kontur Alami [lng, lat])
const kotaBandungBoundary = [
  [107.588, -6.842], [107.606, -6.834], [107.625, -6.848],
  [107.648, -6.863], [107.674, -6.873], [107.702, -6.883],
  [107.726, -6.898], [107.738, -6.916], [107.732, -6.938],
  [107.718, -6.956], [107.696, -6.967], [107.672, -6.968],
  [107.646, -6.966], [107.622, -6.969], [107.596, -6.962],
  [107.576, -6.954], [107.556, -6.938], [107.550, -6.918],
  [107.558, -6.898], [107.568, -6.878], [107.576, -6.858],
  [107.588, -6.842]
];

// 30 Kecamatan Kota Bandung beserta Koordinat Pusat, Elevasi (mdpl), & Titik Pantau
const kecamatanBandungList = [
  { id: "cidadap", name: "Cidadap", wilayah: "Utara", elevation: 895, lat: -6.856, lng: 107.605, hotspot: "Ledeng, Ciumbuleuit & Punclut" },
  { id: "sukasari", name: "Sukasari", wilayah: "Utara", elevation: 825, lat: -6.868, lng: 107.584, hotspot: "Gegerkalong, Setiabudi & Sarijadi" },
  { id: "coblong", name: "Coblong", wilayah: "Utara", elevation: 795, lat: -6.882, lng: 107.616, hotspot: "Dago, Dipatiukur & DAS Cikapundung" },
  { id: "cibeunying_kaler", name: "Cibeunying Kaler", wilayah: "Utara", elevation: 785, lat: -6.885, lng: 107.634, hotspot: "Cigadung, Cihaurgeulis & Sadang Serang" },
  { id: "mandalajati", name: "Mandalajati", wilayah: "Timur", elevation: 780, lat: -6.892, lng: 107.666, hotspot: "Jatihandap, Karang Pamulang & Sindangjaya" },
  { id: "ujungberung", name: "Ujungberung", wilayah: "Timur", elevation: 765, lat: -6.902, lng: 107.702, hotspot: "Alun-Alun Ujungberung & Pasanggrahan" },
  { id: "cibiru", name: "Cibiru", wilayah: "Timur", elevation: 750, lat: -6.924, lng: 107.720, hotspot: "Bundaran Cibiru, Cipadung & Palasari" },
  { id: "sukajadi", name: "Sukajadi", wilayah: "Barat", elevation: 775, lat: -6.886, lng: 107.592, hotspot: "Pasteur, Cipedes & Sukagalih" },
  { id: "cicendo", name: "Cicendo", wilayah: "Barat", elevation: 735, lat: -6.905, lng: 107.588, hotspot: "Dr. Djunjunan (Pasteur) & Bandara Husein" },
  { id: "bandung_wetan", name: "Bandung Wetan", wilayah: "Tengah", elevation: 740, lat: -6.903, lng: 107.618, hotspot: "Gedung Sate, Taman Lansia & Cihapit" },
  { id: "cibeunying_kidul", name: "Cibeunying Kidul", wilayah: "Tengah", elevation: 730, lat: -6.902, lng: 107.643, hotspot: "Cikutra, Padasuka & Cicadas" },
  { id: "arcamanik", name: "Arcamanik", wilayah: "Timur", elevation: 720, lat: -6.915, lng: 107.676, hotspot: "SPOrT Jabar Arcamanik & Cisaranten" },
  { id: "antapani", name: "Antapani", wilayah: "Timur", elevation: 715, lat: -6.916, lng: 107.658, hotspot: "Flyover Antapani & Terusan Jakarta" },
  { id: "kiaracondong", name: "Kiaracondong", wilayah: "Tengah", elevation: 708, lat: -6.924, lng: 107.644, hotspot: "Stasiun Kiaracondong & Babakan Sari" },
  { id: "sumur_bandung", name: "Sumur Bandung", wilayah: "Tengah", elevation: 718, lat: -6.916, lng: 107.614, hotspot: "Braga, Merdeka & Alun-Alun Timur" },
  { id: "andir", name: "Andir", wilayah: "Barat", elevation: 715, lat: -6.916, lng: 107.582, hotspot: "Ciroyom, Kebon Jeruk & Garuda" },
  { id: "bandung_kulon", name: "Bandung Kulon", wilayah: "Barat", elevation: 695, lat: -6.926, lng: 107.565, hotspot: "Cijerah, Gempolsari & Melong" },
  { id: "babakan_ciparay", name: "Babakan Ciparay", wilayah: "Barat", elevation: 690, lat: -6.942, lng: 107.575, hotspot: "Caringin, Margahayu Utara & Sukahaji" },
  { id: "bojongloa_kaler", name: "Bojongloa Kaler", wilayah: "Selatan", elevation: 700, lat: -6.932, lng: 107.590, hotspot: "Jamika, Kopo & Suka Asih" },
  { id: "astanaanyar", name: "Astanaanyar", wilayah: "Selatan", elevation: 702, lat: -6.928, lng: 107.602, hotspot: "Jl. Pagarsih, Cibadak & Sungai Citepus" },
  { id: "regol", name: "Regol", wilayah: "Selatan", elevation: 698, lat: -6.938, lng: 107.610, hotspot: "Tegallega, Pungkur & Moch. Toha" },
  { id: "lengkong", name: "Lengkong", wilayah: "Tengah", elevation: 705, lat: -6.930, lng: 107.624, hotspot: "Buahbatu Dalam, Turangga & Burangrang" },
  { id: "batununggal", name: "Batununggal", wilayah: "Tengah", elevation: 700, lat: -6.936, lng: 107.638, hotspot: "Gatsu, Binong & Kebonwaru" },
  { id: "bojongloa_kidul", name: "Bojongloa Kidul", wilayah: "Selatan", elevation: 685, lat: -6.948, lng: 107.595, hotspot: "Terminal Leuwi Panjang & Cibaduyut" },
  { id: "bandung_kidul", name: "Bandung Kidul", wilayah: "Selatan", elevation: 682, lat: -6.952, lng: 107.626, hotspot: "Mengger, Batununggal Indah & Kujangsari" },
  { id: "buahbatu", name: "Buahbatu", wilayah: "Selatan", elevation: 676, lat: -6.948, lng: 107.654, hotspot: "Simpang Metro Margahayu & Ciwastra" },
  { id: "rancasari", name: "Rancasari", wilayah: "Timur", elevation: 672, lat: -6.948, lng: 107.676, hotspot: "Derwati, Cipamokolan & Manjahlega" },
  { id: "gedebage", name: "Gedebage", wilayah: "Timur", elevation: 666, lat: -6.944, lng: 107.698, hotspot: "Simpang Gedebage, Summarecon & Cimincrang" },
  { id: "panyileukan", name: "Panyileukan", wilayah: "Timur", elevation: 680, lat: -6.934, lng: 107.708, hotspot: "Cipadung Kidul & Mekarmulya" },
  { id: "cinambo", name: "Cinambo", wilayah: "Timur", elevation: 685, lat: -6.924, lng: 107.694, hotspot: "Pakemitan, Sukamulya & Cisaranten Wetan" }
];

// Generator Poligon Spasial 30 Kecamatan Kota Bandung
function generateBandungKecamatanGeoJSON() {
  function clipHalfPlane(poly, mx, my, nx, ny) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = (a[0] - mx) * nx + (a[1] - my) * ny;
      const db = (b[0] - mx) * nx + (b[1] - my) * ny;

      if (da >= 0) out.push(a);
      if ((da >= 0 && db < 0) || (da < 0 && db >= 0)) {
        const t = da / (da - db);
        out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    }
    return out;
  }

  const baseRing = kotaBandungBoundary.slice(0, -1);

  const features = kecamatanBandungList.map((kec, idx) => {
    let cell = baseRing.map(pt => [...pt]);

    for (let j = 0; j < kecamatanBandungList.length; j++) {
      if (idx === j) continue;
      const other = kecamatanBandungList[j];
      const mx = (kec.lng + other.lng) / 2;
      const my = (kec.lat + other.lat) / 2;
      const nx = kec.lng - other.lng;
      const ny = kec.lat - other.lat;
      cell = clipHalfPlane(cell, mx, my, nx, ny);
      if (cell.length < 3) break;
    }

    if (cell.length >= 3) {
      cell.push([...cell[0]]);
    } else {
      const d = 0.007;
      cell = [
        [kec.lng - d, kec.lat - d], [kec.lng + d, kec.lat - d],
        [kec.lng + d, kec.lat + d], [kec.lng - d, kec.lat + d],
        [kec.lng - d, kec.lat - d]
      ];
    }

    return {
      type: "Feature",
      properties: kec,
      geometry: {
        type: "Polygon",
        coordinates: [cell]
      }
    };
  });

  return {
    type: "FeatureCollection",
    features
  };
}

const bandungKecamatanGeoJSON = generateBandungKecamatanGeoJSON();