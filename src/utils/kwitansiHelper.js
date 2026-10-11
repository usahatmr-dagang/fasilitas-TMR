import { LOGO_KWITANSI_BASE64 } from './kwitansiLogo.js';
import PizZip from 'pizzip';

export const terbilang = (angka) => {
  angka = Math.abs(parseInt(angka, 10));
  if (isNaN(angka)) return "";
  if (angka === 0) return "Nol";

  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  const convert = (n) => {
    if (n === 0) return "";
    if (n < 12) return satuan[n];
    if (n < 20) return convert(n - 10) + " Belas";
    if (n < 100) return (convert(Math.floor(n / 10)) + " Puluh " + convert(n % 10)).trim();
    if (n < 200) return ("Seratus " + convert(n - 100)).trim();
    if (n < 1000) return (convert(Math.floor(n / 100)) + " Ratus " + convert(n % 100)).trim();
    if (n < 2000) return ("Seribu " + convert(n - 1000)).trim();
    if (n < 1000000) return (convert(Math.floor(n / 1000)) + " Ribu " + convert(n % 1000)).trim();
    if (n < 1000000000) return (convert(Math.floor(n / 1000000)) + " Juta " + convert(n % 1000000)).trim();
    if (n < 1000000000000) return (convert(Math.floor(n / 1000000000)) + " Milyar " + convert(n % 1000000000)).trim();
    if (n < 1000000000000000) return (convert(Math.floor(n / 1000000000000)) + " Triliun " + convert(n % 1000000000000)).trim();
    return "";
  };

  return convert(angka).replace(/\s+/g, ' ').trim();
};

export const formatRupiahStr = (angka) => {
  return new Intl.NumberFormat('id-ID').format(angka || 0);
};

export const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const formatDateIndonesian = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
};

const escapeXml = (unsafe) => {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

/**
 * Generate full HTML matching the official Excel template:
 * kwitansi rombongan.xlsx & kwitansi promo.xlsx
 */
export const generateKwitansiHtml = ({
  type = 'sewa', // 'sewa' or 'promo'
  namaPenyewa = '',
  nominal = 0,
  kegiatan = '',
  lokasi = '',
  tanggalPelaksanaan = '',
  transferChannel = 'Bank DKI',
  noRef = '',
  jumlahHari = 1,
  namaProduk = '',
  printDate = new Date()
}) => {
  const pDate = printDate instanceof Date ? printDate : new Date(printDate || Date.now());
  const tanggalCetak = pDate.getDate();
  const bulanCetak = MONTH_NAMES_ID[pDate.getMonth()] || '';
  const tahunCetak = pDate.getFullYear();

  const nominalNum = typeof nominal === 'number' ? nominal : (parseInt(String(nominal).replace(/\D/g, ''), 10) || 0);
  const nominalFormatted = formatRupiahStr(nominalNum);
  const terbilangTeks = terbilang(nominalNum) + ' Rupiah';

  // Text formatting according to Excel template rows
  let row10Text = '';
  let row11Text = '';

  if (type === 'promo') {
    row10Text = `Penjualan produk / event promo ${namaProduk || '-'} selama ${jumlahHari || '1'} hari,`;
    row11Text = `pada tanggal ${formatDateIndonesian(tanggalPelaksanaan)}`;
  } else {
    row10Text = `kegiatan ${kegiatan || 'Sewa Fasilitas'} di lokasi ${lokasi || '-'}`;
    row11Text = `pada tanggal ${formatDateIndonesian(tanggalPelaksanaan)}`;
  }

  const row12Text = 'di UP Taman Margasatwa Ragunan';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kwitansi Resmi - ${namaPenyewa}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 15px;
      background-color: #fff;
      color: #000;
    }
    .kwitansi-wrapper {
      width: 100%;
      max-width: 950px;
      margin: 0 auto;
      border: 1.5px solid #000;
      display: flex;
      position: relative;
      background: #ffffff;
      min-height: 400px;
    }
    /* LEFT SIDEBAR BANNER */
    .left-sidebar {
      width: 150px;
      border-right: 1.5px solid #000;
      padding: 16px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      flex-shrink: 0;
      background-color: #fafbf9;
    }
    .left-sidebar .top-title {
      font-size: 8px;
      font-weight: bold;
      line-height: 1.25;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .left-sidebar .sub-title {
      font-size: 9.5px;
      font-weight: bold;
      line-height: 1.2;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .left-sidebar .logo-container {
      margin: 12px 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .left-sidebar .logo-img {
      max-width: 115px;
      max-height: 110px;
      object-fit: contain;
      display: block;
    }
    .left-sidebar .bottom-title {
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 1.2px;
      line-height: 1.3;
      text-transform: uppercase;
    }
    .left-sidebar .bottom-title span {
      font-size: 7px;
      font-weight: normal;
      letter-spacing: 0.5px;
      display: block;
    }
    /* CONTENT AREA */
    .content-area {
      flex: 1;
      padding: 24px 36px 20px 36px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    /* WATERMARK */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.04;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .watermark img {
      max-width: 320px;
      max-height: 250px;
      object-fit: contain;
      filter: grayscale(100%);
    }
    .fields-group {
      position: relative;
      z-index: 1;
    }
    .ref-header {
      display: flex;
      justify-content: flex-end;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #333;
    }
    .field-row {
      display: flex;
      align-items: flex-end;
      min-height: 27px;
      margin-bottom: 2px;
      font-size: 13px;
      line-height: 1.4;
    }
    .field-label {
      width: 160px;
      font-style: italic;
      color: #000;
      flex-shrink: 0;
    }
    .field-colon {
      width: 15px;
      text-align: left;
      font-weight: bold;
      flex-shrink: 0;
    }
    .field-value {
      flex: 1;
      font-weight: bold;
      font-style: italic;
      color: #000;
      border-bottom: 1.5px dotted #555;
      padding-bottom: 2px;
      min-height: 20px;
    }
    .field-value.box-dotted {
      border-top: 1.5px dotted #555;
      border-bottom: 1.5px dotted #555;
      padding: 3px 0;
    }
    /* BOTTOM SECTION */
    .bottom-section {
      position: relative;
      z-index: 1;
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 5px;
    }
    .amount-box {
      font-size: 17px;
      font-weight: bold;
      font-style: italic;
      border-top: 2px solid #000;
      border-bottom: 4px double #000;
      padding: 3px 24px;
      display: inline-block;
      background-color: #fff;
      letter-spacing: 0.5px;
      margin-left: 10px;
    }
    .signature-box {
      text-align: center;
      min-width: 260px;
      font-size: 13px;
    }
    .signature-date {
      font-style: italic;
      font-size: 13px;
      margin-bottom: 60px;
    }
    .signature-line {
      font-weight: bold;
      font-size: 13px;
    }
  </style>
</head>
<body onload="setTimeout(function(){ window.print(); }, 400);">
  <div class="kwitansi-wrapper">
    <!-- LEFT SIDEBAR -->
    <div class="left-sidebar">
      <div>
        <div class="top-title">
          PEMERINTAH PROVINSI<br/>
          DAERAH KHUSUS IBUKOTA<br/>
          JAKARTA
        </div>
        <div class="sub-title">
          TAMAN MARGASATWA<br/>
          RAGUNAN
        </div>
      </div>

      <!-- LOGO RAGUNAN MIRING -->
      <div class="logo-container">
        <img class="logo-img" src="${LOGO_KWITANSI_BASE64}" alt="Logo Taman Margasatwa Ragunan" />
      </div>

      <div class="bottom-title">
        ZOOLOGICAL PARK
        <span>JAKARTA - INDONESIA</span>
      </div>
    </div>

    <!-- CONTENT AREA -->
    <div class="content-area">
      <!-- SUBTLE WATERMARK -->
      <div class="watermark">
        <img src="${LOGO_KWITANSI_BASE64}" alt="Watermark" />
      </div>

      <div class="fields-group">
        <div class="ref-header">
          <span>No. Ref: ${noRef || '-'}</span>
        </div>

        <!-- Row 8: Sudah terima dari -->
        <div class="field-row">
          <div class="field-label">Sudah terima dari</div>
          <div class="field-colon">:</div>
          <div class="field-value">${namaPenyewa || '-'}</div>
        </div>

        <!-- Row 9: Terbilang -->
        <div class="field-row" style="margin: 3px 0;">
          <div class="field-label">Terbilang</div>
          <div class="field-colon">:</div>
          <div class="field-value box-dotted"># ${terbilangTeks} #</div>
        </div>

        <!-- Row 10: Untuk pembayaran -->
        <div class="field-row">
          <div class="field-label">Untuk pembayaran</div>
          <div class="field-colon">:</div>
          <div class="field-value">${row10Text}</div>
        </div>

        <!-- Row 11: Tanggal Pelaksanaan -->
        <div class="field-row">
          <div class="field-label">&nbsp;</div>
          <div class="field-colon">&nbsp;</div>
          <div class="field-value">&nbsp;&nbsp;${row11Text}</div>
        </div>

        <!-- Row 12: Di UP Taman Margasatwa Ragunan -->
        <div class="field-row">
          <div class="field-label">&nbsp;</div>
          <div class="field-colon">&nbsp;</div>
          <div class="field-value">&nbsp;&nbsp;${row12Text}</div>
        </div>
      </div>

      <!-- BOTTOM SECTION -->
      <div class="bottom-section">
        <div>
          <div class="amount-box">
            Rp. ${nominalFormatted},00
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-date">Jakarta, ${tanggalCetak} ${bulanCetak} ${tahunCetak}</div>
          <div class="signature-line">( .................................................... )</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Trigger browser print window for receipt
 */
export const openKwitansiPrintWindow = (params) => {
  const html = generateKwitansiHtml(params);
  const printWindow = window.open('', '', 'width=980,height=650');
  if (!printWindow) {
    alert("Popup browser diblokir. Harap izinkan pop-up untuk mencetak kwitansi.");
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};

/**
 * Generate Excel blob from template in public
 */
export const generateKwitansiExcelBlob = async ({
  type = 'sewa',
  item = {},
  channelTransfer = 'Bank DKI',
  printDate = new Date()
}) => {
  const fileNameStr = type === 'sewa' ? 'rombongan' : 'promo';
  const response = await fetch(`/kwitansi ${fileNameStr}.xlsx`);
  if (!response.ok) throw new Error(`Template kwitansi ${fileNameStr}.xlsx tidak ditemukan di folder public`);
  const arrayBuffer = await response.arrayBuffer();

  const pDate = printDate instanceof Date ? printDate : new Date(printDate || Date.now());
  const tglStr = String(pDate.getDate());
  const blnStr = MONTH_NAMES_ID[pDate.getMonth()] || '';
  const thnStr = String(pDate.getFullYear());

  let replacements = {};
  if (type === 'promo') {
    const nominalNumeric = item.jumlahTransferNumeric || parseInt(String(item.jumlahTransfer).replace(/\D/g, ''), 10) || 0;
    replacements = {
      '<<Nama PT>>': item.namaPerusahaan || '',
      '<<Terbilang>>': terbilang(nominalNumeric) + ' Rupiah',
      '<<nama produk>>': item.namaProduk || '',
      '<<Jumlah hari>>': String(item.jumlahHari || '1'),
      '<<tanggal promo>>': item.tanggalPromo || '',
      '<<Transfer>>': channelTransfer || 'Bank DKI',
      '<<reff>>': item.noRef || item.id || `KWT-TMR-${thnStr}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${tglStr.padStart(2, '0')}`,
      '<<tanggal>>': tglStr,
      '<<bulan>>': blnStr,
      '<<tahun>>': thnStr,
      '<<Jml Transfer>>': formatRupiahStr(nominalNumeric),
      '<<terbilang>>': terbilang(nominalNumeric)
    };
  } else {
    const nominalNumeric = item.total_biaya || 0;
    replacements = {
      '<<Nama Penyewa>>': (item.nama_penyewa || '') + (item.instansi_penyewa ? ' / ' + item.instansi_penyewa : ''),
      '<<Nama PT>>': item.nama_penyewa || '',
      '<<Terbilang>>': terbilang(nominalNumeric) + ' Rupiah',
      '<<Lokasi Sewa>>': item.lokasi_sewa || '',
      '<<Kegiatan>>': item.kegiatan || 'Sewa Fasilitas',
      '<<Tanggal Sewa>>': item.tanggal_sewa || '',
      '<<Transfer>>': channelTransfer || 'Bank DKI',
      '<<reff>>': item.id_sewa || item.id || '',
      '<<tanggal>>': tglStr,
      '<<bulan>>': blnStr,
      '<<tahun>>': thnStr,
      '<<Jml Transfer>>': formatRupiahStr(nominalNumeric),
      '<<terbilang>>': terbilang(nominalNumeric)
    };
  }

  const zip = new PizZip(arrayBuffer);
  Object.keys(zip.files).forEach(filename => {
    if (filename.endsWith('.xml')) {
      let content = zip.files[filename].asText();
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
        const escapedKey = escapeXml(key);
        const valStr = escapeXml(value);
        if (content.includes(escapedKey)) {
          content = content.split(escapedKey).join(valStr);
          changed = true;
        }
        if (content.includes(key)) {
          content = content.split(key).join(valStr);
          changed = true;
        }
      }
      if (content.includes('melalui transfer')) {
        content = content.split('di UP Taman Margasatwa Ragunan melalui transfer <<Transfer>> dengan No.ref <<reff>>').join('di UP Taman Margasatwa Ragunan');
        content = content.replace(/\s*melalui transfer[^<]*/g, '');
        changed = true;
      }
      if (changed) {
        zip.file(filename, content);
      }
    }
  });

  return zip.generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Direct download Excel file in browser
 */
export const downloadKwitansiExcel = async (options) => {
  const blob = await generateKwitansiExcelBlob(options);
  const type = options.type || 'sewa';
  const item = options.item || {};
  const nama = type === 'sewa' ? (item.nama_penyewa || 'Penyewa') : (item.namaPerusahaan || 'Promo');
  const fileName = `Kwitansi-${type}-${nama.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
