// src/utils/promoDateHelper.js
// Utility terpadu untuk pengolahan tanggal promo, ekstraksi tanggal event, dan validasi ketersediaan titik promo

export const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const monthMap = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, ags: 8,
  september: 9, sep: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  desember: 12, des: 12
};

// Normalisasi format tanggal ke YYYY-MM-DD
export const normalizeDateToYMD = (dateInput) => {
  if (!dateInput) return '';
  const s = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes('/')) {
    const p = s.split('/');
    if (p.length === 3 && p[2].length === 4) {
      return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return s;
};

// Format tanggal ringkas (2026-10-18 -> 18 Okt 2026)
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  const norm = normalizeDateToYMD(dateStr);
  const parts = norm.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parseInt(d, 10)} ${shortMonths[parseInt(m, 10) - 1] || ''} ${y}`;
};

// Parsing seluruh tanggal dari teks deskriptif seperti:
// "2 titik untuk tanggal 18 Oktober 2026", "18 dan 19 Oktober 2026", "1 - 3 Mei 2026"
export const parseDatesFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
  const dates = new Set();
  const str = text.trim();

  // 1. Direct YYYY-MM-DD
  const isoMatches = str.match(/\b\d{4}-\d{2}-\d{2}\b/g);
  if (isoMatches) isoMatches.forEach(d => dates.add(d));

  // 2. Format DD/MM/YYYY atau DD-MM-YYYY
  const slashMatches = str.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g);
  if (slashMatches) {
    slashMatches.forEach(m => {
      const parts = m.split(/[\/\-]/);
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const mo = parts[1].padStart(2, '0');
        const y = parts[2];
        dates.add(`${y}-${mo}-${d}`);
      }
    });
  }

  // 3. Bersihkan "X titik" agar jumlah titik tidak disangka angka hari (misal '2 titik untuk tanggal 18 Oktober')
  const cleaned = str.replace(/\b\d+\s*titik\b/gi, ' ');

  // Temukan tahun 4 digit jika ada
  const yearMatches = [...cleaned.matchAll(/\b(20\d\d)\b/g)];
  const fallbackYear = yearMatches.length > 0 ? parseInt(yearMatches[0][1], 10) : new Date().getFullYear();

  // Pola nama bulan bahasa Indonesia
  const monthRegex = /\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|ags|sep|okt|nov|des)\b/gi;
  
  let match;
  let lastMonthEnd = 0;
  while ((match = monthRegex.exec(cleaned)) !== null) {
    const monthKey = match[1].toLowerCase();
    const monthNum = monthMap[monthKey];
    if (!monthNum) continue;

    const monthIndex = match.index;
    const preText = cleaned.slice(Math.max(lastMonthEnd, monthIndex - 40), monthIndex);
    const postText = cleaned.slice(monthIndex + match[0].length, Math.min(cleaned.length, monthIndex + match[0].length + 20));

    // Tahun setelah bulan jika ada, misal 'Oktober 2026'
    const postYearMatch = postText.match(/^\s*(20\d\d)\b/);
    const year = postYearMatch ? parseInt(postYearMatch[1], 10) : fallbackYear;

    // Rentang hari: '18 - 20' atau '18 s/d 20' atau '18 sampai 20'
    const rangeMatch = preText.match(/\b(\d{1,2})\s*(?:-|s\/d|sd|sampai)\s*(\d{1,2})\s*$/);
    if (rangeMatch) {
      const startDay = parseInt(rangeMatch[1], 10);
      const endDay = parseInt(rangeMatch[2], 10);
      for (let day = startDay; day <= endDay; day++) {
        const y = String(year);
        const m = String(monthNum).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        dates.add(`${y}-${m}-${d}`);
      }
    } else {
      // Angka hari individual sebelum bulan ini, misal '18 dan 19' atau '18'
      const daysMatches = [...preText.matchAll(/\b(\d{1,2})\b/g)];
      if (daysMatches.length > 0) {
        daysMatches.forEach(dm => {
          const day = parseInt(dm[1], 10);
          if (day >= 1 && day <= 31) {
            const y = String(year);
            const m = String(monthNum).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            dates.add(`${y}-${m}-${d}`);
          }
        });
      }
    }

    lastMonthEnd = monthIndex + match[0].length;
  }

  return Array.from(dates).sort();
};

// Helper: Ekstraksi seluruh tanggal YYYY-MM-DD dari promo
// HANYA MENGGUNAKAN TANGGAL KEGIATAN PROMO (bukan tanggalTransfer pembayaran!)
export const extractPromoDates = (promo) => {
  const dates = new Set();
  if (!promo) return [];

  // 1. Array selectedDates (dari form booking pendaftaran)
  if (promo.selectedDates && Array.isArray(promo.selectedDates)) {
    promo.selectedDates.forEach(d => {
      const dStr = typeof d === 'object' && d !== null ? d.date : d;
      const norm = normalizeDateToYMD(dStr);
      if (norm) dates.add(norm);
    });
  }

  // 2. Array dates jika ada
  if (promo.dates && Array.isArray(promo.dates)) {
    promo.dates.forEach(d => {
      const norm = normalizeDateToYMD(d);
      if (norm) dates.add(norm);
    });
  }

  // 3. String deskripsi tanggalPromo (misal: "2 titik untuk tanggal 18 Oktober 2026")
  if (promo.tanggalPromo) {
    const parsed = parseDatesFromText(promo.tanggalPromo);
    parsed.forEach(d => dates.add(d));
  }

  // CATATAN KRUSIAL:
  // promo.tanggalTransfer SENGAJA TIDAK dimasukkan ke sini!
  // tanggalTransfer adalah tanggal bukti setor uang bank, bukan tanggal pelaksanaan promo di lapangan!

  return Array.from(dates).sort();
};

// Helper: Cek apakah promo aktif pada tanggal tertentu (YYYY-MM-DD)
export const isPromoOnDate = (promo, targetDateYMD) => {
  if (!promo || !targetDateYMD) return false;
  const normTarget = normalizeDateToYMD(targetDateYMD);

  const dates = extractPromoDates(promo);
  if (dates.length > 0) {
    return dates.includes(normTarget);
  }

  // Fallback cadangan jika teks tanggalPromo tidak ter-parse
  if (promo.tanggalPromo) {
    const parts = normTarget.split('-');
    if (parts.length === 3) {
      const [, m, d] = parts;
      const mIdx = parseInt(m, 10) - 1;
      const monthName = monthNames[mIdx] || '';
      const dayNum = parseInt(d, 10);
      
      const cleaned = String(promo.tanggalPromo).replace(/\b\d+\s*titik\b/gi, ' ').toLowerCase();
      const dayRegex = new RegExp(`\\b${dayNum}\\b`);
      if (dayRegex.test(cleaned) && cleaned.includes(monthName.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
};

// Helper: Menentukan jumlah titik yang diminta promo pada tanggal tertentu
export const getPromoRequestedTitikQty = (promo, dateYMD) => {
  if (!promo) return 1;
  const normDate = dateYMD ? normalizeDateToYMD(dateYMD) : '';
  
  if (normDate && promo.selectedDates && Array.isArray(promo.selectedDates)) {
    const match = promo.selectedDates.find(d => {
      const dStr = typeof d === 'object' && d !== null ? d.date : d;
      return normalizeDateToYMD(dStr) === normDate;
    });
    if (match && typeof match === 'object' && match.titik) {
      const q = parseInt(match.titik, 10);
      if (!isNaN(q) && q > 0) return q;
    }
  }

  if (promo.jumlahTitik) {
    const q = parseInt(promo.jumlahTitik, 10);
    if (!isNaN(q) && q > 0) return q;
  }

  if (promo.tanggalPromo) {
    const m = String(promo.tanggalPromo).match(/(\d+)\s*titik/i);
    if (m) {
      const q = parseInt(m[1], 10);
      if (!isNaN(q) && q > 0) return q;
    }
  }

  return 1;
};

// Helper: Menentukan apakah promo memasang banner pada tanggal tertentu
export const hasPromoBannerOnDate = (promo, dateYMD) => {
  if (!promo) return false;
  const normDate = dateYMD ? normalizeDateToYMD(dateYMD) : '';
  
  if (normDate && promo.selectedDates && Array.isArray(promo.selectedDates)) {
    const match = promo.selectedDates.find(d => {
      const dStr = typeof d === 'object' && d !== null ? d.date : d;
      return normalizeDateToYMD(dStr) === normDate;
    });
    if (match && typeof match === 'object' && match.banner) {
      if (parseInt(match.banner, 10) > 0) return true;
    }
  }

  if (promo.hasBanner) return true;
  if (parseInt(promo.jumlahBanner, 10) > 0) return true;

  return false;
};

// Helper: Menentukan jumlah banner promo pada tanggal tertentu
export const getPromoBannerCountOnDate = (promo, dateYMD) => {
  if (!promo) return 0;
  const normDate = dateYMD ? normalizeDateToYMD(dateYMD) : '';
  
  if (normDate && promo.selectedDates && Array.isArray(promo.selectedDates)) {
    const match = promo.selectedDates.find(d => {
      const dStr = typeof d === 'object' && d !== null ? d.date : d;
      return normalizeDateToYMD(dStr) === normDate;
    });
    if (match && typeof match === 'object' && match.banner) {
      const b = parseInt(match.banner, 10);
      if (!isNaN(b) && b > 0) return b;
    }
  }

  const b = parseInt(promo.jumlahBanner, 10);
  if (!isNaN(b) && b > 0) return b;
  return promo.hasBanner ? 1 : 0;
};

// Helper: Ringkasan teks rentang tanggal (misal: "1 - 2 April 2026")
export const formatDatesSummary = (dateStrings) => {
  if (!dateStrings || dateStrings.length === 0) return '-';
  const sorted = [...dateStrings].sort();
  const byMonthYear = {};
  
  sorted.forEach(dStr => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const my = `${monthNames[parseInt(m, 10) - 1]} ${y}`;
      if (!byMonthYear[my]) byMonthYear[my] = [];
      byMonthYear[my].push(parseInt(d, 10));
    }
  });

  const monthParts = [];
  for (const [my, days] of Object.entries(byMonthYear)) {
    days.sort((a, b) => a - b);
    if (days.length === 1) {
      monthParts.push(`${days[0]} ${my}`);
    } else if (days.length === 2) {
      monthParts.push(`${days[0]} - ${days[1]} ${my}`);
    } else {
      const isContinuous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
      if (isContinuous) {
        monthParts.push(`${days[0]} - ${days[days.length - 1]} ${my}`);
      } else {
        monthParts.push(`${days.join(', ')} ${my}`);
      }
    }
  }

  return monthParts.join(', ');
};

// Helper: Menghitung rentang tanggal YYYY-MM-DD
export const generateDatesRange = (startDateStr, endDateStr) => {
  if (!startDateStr) return [];
  if (!endDateStr) return [startDateStr];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [startDateStr];

  const dates = [];
  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};
