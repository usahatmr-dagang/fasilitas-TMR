// Master Data 100 Titik Lokasi Promo Taman Margasatwa Ragunan (TMR)
// Koordinat disebar secara realistis di area publik, plaza, jalur pedestrian, dan dekat gerbang Ragunan.
// Zona dibiarkan fleksibel agar dapat diatur atau dikelompokkan oleh admin sesuai kebutuhan lapangan.

const generateDefaultTitikPromo = () => {
  const points = [];
  
  // Distribusi area di dalam kawasan Ragunan (Lat: -6.304 s/d -6.318, Lng: 106.816 s/d 106.825)
  // 1. Area Gerbang Masuk Utama / Utara & Plaza Penerimaan (1 - 20)
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, '0');
    const col = (i - 1) % 5;
    const row = Math.floor((i - 1) / 5);
    const lat = Number((-6.3048 - (row * 0.0007) + (col * 0.00015)).toFixed(6));
    const lng = Number((106.8188 + (col * 0.0008) + (row * 0.0001)).toFixed(6));
    points.push({
      id: `TP-${String(i).padStart(3, '0')}`,
      nomor: i,
      kode: `TP-${String(i).padStart(3, '0')}`,
      nama: `Titik Promo ${pad}`,
      zona: '', // Fleksibel
      lat: lat,
      lng: lng,
      keterangan: `Area Plaza Gerbang Utara #${pad}`,
      status: 'aktif'
    });
  }

  // 2. Area Koridor Pusat, Informasi & Taman Margasatwa (21 - 40)
  for (let i = 21; i <= 40; i++) {
    const pad = String(i).padStart(2, '0');
    const idx = i - 21;
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const lat = Number((-6.3080 - (row * 0.0008) + (col * 0.0001)).toFixed(6));
    const lng = Number((106.8182 + (col * 0.0009)).toFixed(6));
    points.push({
      id: `TP-${String(i).padStart(3, '0')}`,
      nomor: i,
      kode: `TP-${String(i).padStart(3, '0')}`,
      nama: `Titik Promo ${pad}`,
      zona: '', // Fleksibel
      lat: lat,
      lng: lng,
      keterangan: `Area Koridor Pusat #${pad}`,
      status: 'aktif'
    });
  }

  // 3. Area Koridor Barat / Arah Schmutzer & Margasatwa Barat (41 - 60)
  for (let i = 41; i <= 60; i++) {
    const pad = String(i).padStart(2, '0');
    const idx = i - 41;
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const lat = Number((-6.3085 - (row * 0.0009)).toFixed(6));
    const lng = Number((106.8158 + (col * 0.0006)).toFixed(6));
    points.push({
      id: `TP-${String(i).padStart(3, '0')}`,
      nomor: i,
      kode: `TP-${String(i).padStart(3, '0')}`,
      nama: `Titik Promo ${pad}`,
      zona: '', // Fleksibel
      lat: lat,
      lng: lng,
      keterangan: `Area Koridor Barat #${pad}`,
      status: 'aktif'
    });
  }

  // 4. Area Koridor Timur & Pintu Gerbang Timur (61 - 80)
  for (let i = 61; i <= 80; i++) {
    const pad = String(i).padStart(2, '0');
    const idx = i - 61;
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const lat = Number((-6.3090 - (row * 0.0009)).toFixed(6));
    const lng = Number((106.8228 + (col * 0.0006)).toFixed(6));
    points.push({
      id: `TP-${String(i).padStart(3, '0')}`,
      nomor: i,
      kode: `TP-${String(i).padStart(3, '0')}`,
      nama: `Titik Promo ${pad}`,
      zona: '', // Fleksibel
      lat: lat,
      lng: lng,
      keterangan: `Area Koridor Timur #${pad}`,
      status: 'aktif'
    });
  }

  // 5. Area Selatan, Sekitar Danau & Jalur Rekreasi (81 - 100)
  for (let i = 81; i <= 100; i++) {
    const pad = String(i).padStart(2, '0');
    const idx = i - 81;
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const lat = Number((-6.3142 - (row * 0.0008)).toFixed(6));
    const lng = Number((106.8180 + (col * 0.0010)).toFixed(6));
    points.push({
      id: `TP-${String(i).padStart(3, '0')}`,
      nomor: i,
      kode: `TP-${String(i).padStart(3, '0')}`,
      nama: `Titik Promo ${pad}`,
      zona: '', // Fleksibel
      lat: lat,
      lng: lng,
      keterangan: `Area Rekreasi Danau Selatan #${pad}`,
      status: 'aktif'
    });
  }

  return points;
};

export const defaultTitikPromoList = generateDefaultTitikPromo();
