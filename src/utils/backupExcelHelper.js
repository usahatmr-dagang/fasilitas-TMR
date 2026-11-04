import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatTanggalLengkap = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const s = String(dateStr).trim();
    let d;
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) {
        const y = p[2].length === 4 ? p[2] : p[0];
        const m = p[1];
        const day = p[2].length === 4 ? p[0] : p[2];
        d = new Date(`${y}-${m}-${day}`);
      }
    } else {
      d = new Date(s);
    }
    if (isNaN(d.getTime())) return dateStr;
    return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export const getNamaHari = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return NAMA_HARI[d.getDay()] || '-';
  } catch {
    return '-';
  }
};

/**
 * Membuat Workbook ExcelJS dengan format profesional resmi TMR Ragunan
 */
export const buildBackupWorkbook = async (records = [], options = {}) => {
  const {
    periodeLabel = 'Semua Data',
    startDate = null,
    generatedBy = 'Admin TMR'
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Informasi Fasilitas TMR Ragunan';
  workbook.lastModifiedBy = generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Data Sewa Fasilitas', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }
  });

  // Tampilkan grid lines
  worksheet.views = [{ showGridLines: true }];

  // 1. Judul & Header Laporan
  worksheet.mergeCells('A1:O1');
  const titleCell1 = worksheet.getCell('A1');
  titleCell1.value = 'SISTEM INFORMASI FASILITAS - TAMAN MARGASATWA RAGUNAN';
  titleCell1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF064E3B' } };
  titleCell1.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 26;

  worksheet.mergeCells('A2:O2');
  const titleCell2 = worksheet.getCell('A2');
  titleCell2.value = `LAPORAN DATA CADANGAN (BACKUP) RESERVASI & PENYEWAAN FASILITAS`;
  titleCell2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  worksheet.mergeCells('A3:O3');
  const titleCell3 = worksheet.getCell('A3');
  const now = new Date();
  const tglWibStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(now);
  titleCell3.value = `Periode Data: ${periodeLabel}  |  Dibuat Pada: ${tglWibStr} WIB  |  Total: ${records.length} Data`;
  titleCell3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF475569' } };
  titleCell3.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(3).height = 18;

  // Row 4 Kosong
  worksheet.getRow(4).height = 10;

  // 2. Definisi Kolom Header (Row 5)
  const columns = [
    { header: 'No', key: 'no', width: 6, align: 'center' },
    { header: 'ID Sewa', key: 'id_sewa', width: 17, align: 'center' },
    { header: 'Tanggal Sewa', key: 'tanggal_sewa', width: 15, align: 'center' },
    { header: 'Hari', key: 'hari', width: 11, align: 'center' },
    { header: 'Lokasi Fasilitas', key: 'lokasi_sewa', width: 28, align: 'left' },
    { header: 'Nama Penyewa', key: 'nama_penyewa', width: 28, align: 'left' },
    { header: 'Instansi / Lembaga', key: 'instansi_penyewa', width: 26, align: 'left' },
    { header: 'PIC Rombongan', key: 'pic_rombongan', width: 20, align: 'left' },
    { header: 'No. HP Penyewa', key: 'no_hp_penyewa', width: 18, align: 'center' },
    { header: 'PIC Kantor (TMR)', key: 'pic_kantor', width: 18, align: 'center' },
    { header: 'Status Pembayaran', key: 'status_pembayaran', width: 20, align: 'center' },
    { header: 'Total Biaya (Rp)', key: 'total_biaya', width: 19, align: 'right' },
    { header: 'Listrik', key: 'listrik_tambahan', width: 12, align: 'center' },
    { header: 'Keterangan', key: 'keterangan', width: 35, align: 'left' },
    { header: 'Waktu Booking', key: 'tanggal_booking', width: 20, align: 'center' }
  ];

  const headerRow = worksheet.getRow(5);
  headerRow.height = 28;

  columns.forEach((col, idx) => {
    const colNumber = idx + 1;
    worksheet.getColumn(colNumber).width = col.width;
    const cell = headerRow.getCell(colNumber);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' } // Emerald green TMR
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF064E3B' } },
      bottom: { style: 'medium', color: { argb: 'FF064E3B' } },
      left: { style: 'thin', color: { argb: 'FF064E3B' } },
      right: { style: 'thin', color: { argb: 'FF064E3B' } }
    };
  });

  // 3. Masukkan Data Rows
  let currentRowIdx = 6;
  let totalNominal = 0;

  records.forEach((record, index) => {
    const row = worksheet.getRow(currentRowIdx);
    row.height = 20;

    const nominalNum = Number(record.total_biaya) || 0;
    totalNominal += nominalNum;

    const isMaintenance = record.status_pembayaran === 'Ditutup' || record.nama_penyewa?.includes('DITUTUP');
    const isEven = index % 2 === 1;

    let rowBg = isEven ? 'FFF9FAFB' : 'FFFFFFFF';
    if (isMaintenance) rowBg = 'FFF1F5F9'; // Soft slate for maintenance

    const rowData = {
      no: index + 1,
      id_sewa: record.id_sewa || '-',
      tanggal_sewa: record.tanggal_sewa || '-',
      hari: getNamaHari(record.tanggal_sewa),
      lokasi_sewa: record.lokasi_sewa || '-',
      nama_penyewa: record.nama_penyewa || '-',
      instansi_penyewa: record.instansi_penyewa || '-',
      pic_rombongan: record.pic_rombongan || '-',
      no_hp_penyewa: record.no_hp_penyewa || '-',
      pic_kantor: record.pic_kantor || '-',
      status_pembayaran: record.status_pembayaran || 'Belum Transfer',
      total_biaya: nominalNum,
      listrik_tambahan: record.listrik_tambahan ? 'Ya' : 'Tidak',
      keterangan: record.keterangan || record.catatan || '-',
      tanggal_booking: record.tanggal_booking || '-'
    };

    columns.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = rowData[col.key];
      cell.font = { name: 'Calibri', size: 9, color: { argb: isMaintenance ? 'FF64748B' : 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: col.align, wrapText: false };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Format khusus nominal
      if (col.key === 'total_biaya') {
        cell.numFmt = '"Rp"#,##0;("Rp"#,##0);"-"';
      }

      // Warna badge status pembayaran
      if (col.key === 'status_pembayaran') {
        const st = String(cell.value).toLowerCase();
        if (st.includes('lunas') || st.includes('sudah transfer')) {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF047857' } };
        } else if (st.includes('menunggu')) {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFD97706' } };
        } else if (st.includes('ditutup')) {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFE11D48' } };
        }
      }
    });

    currentRowIdx++;
  });

  // 4. Baris Total Summary di bagian bawah
  const summaryRow = worksheet.getRow(currentRowIdx);
  summaryRow.height = 24;

  worksheet.mergeCells(`A${currentRowIdx}:K${currentRowIdx}`);
  const labelTotalCell = summaryRow.getCell(1);
  labelTotalCell.value = `TOTAL KESELURUHAN (${records.length} TRANSAKSI):`;
  labelTotalCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF064E3B' } };
  labelTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };
  labelTotalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };

  // Total Nominal Cell
  const totalNominalCell = summaryRow.getCell(12);
  totalNominalCell.value = totalNominal;
  totalNominalCell.numFmt = '"Rp"#,##0;("Rp"#,##0);"-"';
  totalNominalCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF064E3B' } };
  totalNominalCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalNominalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };

  // Empty cells fill
  for (let c = 13; c <= 15; c++) {
    const cCell = summaryRow.getCell(c);
    cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
  }

  // Border untuk baris summary
  for (let c = 1; c <= 15; c++) {
    const cell = summaryRow.getCell(c);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF059669' } },
      bottom: { style: 'double', color: { argb: 'FF047857' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  }

  return workbook;
};

/**
 * Trigger download file Excel di browser
 */
export const downloadBackupExcel = async (records = [], options = {}) => {
  const workbook = await buildBackupWorkbook(records, options);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const now = new Date();
  const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = options.filename || `Backup_Sewa_TMR_${dateTag}.xlsx`;

  saveAs(blob, filename);
  return true;
};
