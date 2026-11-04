import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';

const firebaseConfig = {
    apiKey: "AIzaSyDRPLoFws3I_JoagIKpdj28JSX4hw_DvUk",
    authDomain: "fasilitas-tmr.firebaseapp.com",
    projectId: "fasilitas-tmr",
    storageBucket: "fasilitas-tmr.firebasestorage.app",
    messagingSenderId: "905355425334",
    appId: "1:905355425334:web:71aa3289c7cb54e1a60a97"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr === 'object') {
        if (dateStr.seconds !== undefined) {
            const d = new Date(dateStr.seconds * 1000);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
            return `${dateStr.getFullYear()}-${String(dateStr.getMonth() + 1).padStart(2, '0')}-${String(dateStr.getDate()).padStart(2, '0')}`;
        }
    }
    const cleanStr = String(dateStr).trim();
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            const y = parts[2].length === 4 ? parts[2] : (parts[0].length === 4 ? parts[0] : parts[2]);
            const m = parts[1].padStart(2, '0');
            const d = (parts[2].length === 4 ? parts[0] : parts[2]).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    }
    const mYmd = cleanStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (mYmd) {
        return `${mYmd[1]}-${String(mYmd[2]).padStart(2, '0')}-${String(mYmd[3]).padStart(2, '0')}`;
    }
    return cleanStr;
}

function getNamaHari(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return NAMA_HARI[d.getDay()] || '-';
    } catch {
        return '-';
    }
}

function formatTanggalIndo(dateStr) {
    if (!dateStr) return '-';
    try {
        const norm = normalizeDate(dateStr);
        const [y, m, d] = norm.split('-');
        const date = new Date(y, m - 1, d);
        if (isNaN(date.getTime())) return dateStr;
        return `${NAMA_HARI[date.getDay()]}, ${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

/**
 * Buat Excel buffer dari records
 */
async function generateExcelBuffer(records, startDateStr, titleLabel) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Informasi Fasilitas TMR Ragunan';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Data Sewa Fasilitas', {
        pageSetup: { orientation: 'landscape', paperSize: 9 }
    });
    worksheet.views = [{ showGridLines: true }];

    // Header Laporan
    worksheet.mergeCells('A1:O1');
    const t1 = worksheet.getCell('A1');
    t1.value = 'SISTEM INFORMASI FASILITAS - TAMAN MARGASATWA RAGUNAN';
    t1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF064E3B' } };
    t1.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 26;

    worksheet.mergeCells('A2:O2');
    const t2 = worksheet.getCell('A2');
    t2.value = `LAPORAN DATA CADANGAN (BACKUP) RESERVASI & PENYEWAAN FASILITAS`;
    t2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    t2.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.mergeCells('A3:O3');
    const t3 = worksheet.getCell('A3');
    const nowWib = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' });
    t3.value = `Periode Data: ${titleLabel}  |  Dibuat: ${nowWib} WIB  |  Total: ${records.length} Reservasi`;
    t3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF475569' } };
    t3.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 18;

    worksheet.getRow(4).height = 10;

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
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF064E3B' } },
            bottom: { style: 'medium', color: { argb: 'FF064E3B' } },
            left: { style: 'thin', color: { argb: 'FF064E3B' } },
            right: { style: 'thin', color: { argb: 'FF064E3B' } }
        };
    });

    let currentRowIdx = 6;
    let totalNominal = 0;

    records.forEach((record, index) => {
        const row = worksheet.getRow(currentRowIdx);
        row.height = 20;

        const nominalNum = Number(record.total_biaya) || 0;
        totalNominal += nominalNum;

        const isMaintenance = record.status_pembayaran === 'Ditutup' || record.nama_penyewa?.includes('DITUTUP');
        const isEven = index % 2 === 1;
        const rowBg = isMaintenance ? 'FFF1F5F9' : (isEven ? 'FFF9FAFB' : 'FFFFFFFF');

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
            cell.alignment = { vertical: 'middle', horizontal: col.align };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };

            if (col.key === 'total_biaya') {
                cell.numFmt = '"Rp"#,##0;("Rp"#,##0);"-"';
            }
        });

        currentRowIdx++;
    });

    // Summary Row
    const summaryRow = worksheet.getRow(currentRowIdx);
    summaryRow.height = 24;
    worksheet.mergeCells(`A${currentRowIdx}:K${currentRowIdx}`);
    const lTotal = summaryRow.getCell(1);
    lTotal.value = `TOTAL KESELURUHAN (${records.length} TRANSAKSI):`;
    lTotal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF064E3B' } };
    lTotal.alignment = { vertical: 'middle', horizontal: 'right' };
    lTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };

    const tNominal = summaryRow.getCell(12);
    tNominal.value = totalNominal;
    tNominal.numFmt = '"Rp"#,##0;("Rp"#,##0);"-"';
    tNominal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF064E3B' } };
    tNominal.alignment = { vertical: 'middle', horizontal: 'right' };
    tNominal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };

    for (let c = 13; c <= 15; c++) {
        summaryRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
    }

    for (let c = 1; c <= 15; c++) {
        summaryRow.getCell(c).border = {
            top: { style: 'thin', color: { argb: 'FF059669' } },
            bottom: { style: 'double', color: { argb: 'FF047857' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
    }

    return await workbook.xlsx.writeBuffer();
}

/**
 * Kirim email dengan lampiran Excel
 */
async function sendBackupEmail({ recipient, subject, htmlBody, excelBuffer, filename }) {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;

    // Cek jika Resend API key tersedia
    if (process.env.RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM || 'TMR System <onboarding@resend.dev>',
                to: [recipient],
                subject: subject,
                html: htmlBody,
                attachments: [
                    {
                        filename: filename,
                        content: Buffer.from(excelBuffer).toString('base64')
                    }
                ]
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal mengirim email via Resend');
        return { method: 'Resend API', id: data.id };
    }

    // Gunakan Nodemailer SMTP
    if (!smtpUser || !smtpPass) {
        throw new Error(
            'KREDENSIAL_EMAIL_BELUM_DIATUR: Silakan atur Environment Variables di Vercel: SMTP_USER (email pengirim) dan SMTP_PASS (App Password Gmail 16 karakter). ' +
            'Hubungi admin jika Anda membutuhkan bantuan setup akun email pengirim.'
        );
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    const info = await transporter.sendMail({
        from: `"TMR System - Fasilitas Ragunan" <${smtpUser}>`,
        to: recipient,
        subject: subject,
        html: htmlBody,
        attachments: [
            {
                filename: filename,
                content: Buffer.from(excelBuffer)
            }
        ]
    });

    return { method: 'Nodemailer SMTP', messageId: info.messageId };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Ambil target penerima email (default: alfadijkt@gmail.com)
        const recipientEmail = req.query.email || req.body?.email || 'alfadijkt@gmail.com';

        // Hitung tanggal hari ini di WIB (UTC+7)
        // Format YYYY-MM-DD
        const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const currentYear = nowWib.getFullYear();
        const currentMonth = String(nowWib.getMonth() + 1).padStart(2, '0');
        const currentDay = String(nowWib.getDate()).padStart(2, '0');
        const todayStrWib = `${currentYear}-${currentMonth}-${currentDay}`;

        // Tanggal mulai filter: jika diberikan via query/body, pakai itu; jika tidak, default hari ini (WIB)
        const startDateStr = req.query.startDate || req.body?.startDate || todayStrWib;

        let allRecords = [];

        // Jika dikirim dari browser via POST dengan records yang sudah di-cache
        if (req.method === 'POST' && Array.isArray(req.body?.records) && req.body.records.length > 0) {
            allRecords = req.body.records;
        } else {
            // Login ke Firebase sebagai service user untuk membaca sewaList
            const email = process.env.FIREBASE_API_EMAIL || "api_service@ragunan.com";
            const password = process.env.FIREBASE_API_PASSWORD || "SandiApiRahasia123!";
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (authErr) {
                console.warn("API Auth warning:", authErr.message);
            }

            const querySnapshot = await getDocs(collection(db, 'sewaList'));
            querySnapshot.forEach(doc => {
                allRecords.push({ docId: doc.id, ...doc.data() });
            });
        }

        // Filter: data yang menyewa dari startDateStr ke depan
        const filteredRecords = allRecords.filter(s => {
            const tgl = normalizeDate(s.tanggal_sewa);
            if (!tgl) return false;
            if (startDateStr === 'all' || startDateStr === 'semua') return true;
            return tgl >= startDateStr;
        });

        // Urutkan berdasarkan tanggal_sewa ascending (dari yang terdekat ke depan)
        filteredRecords.sort((a, b) => {
            const tA = normalizeDate(a.tanggal_sewa);
            const tB = normalizeDate(b.tanggal_sewa);
            return tA.localeCompare(tB) || (a.lokasi_sewa || '').localeCompare(b.lokasi_sewa || '');
        });

        const totalNominal = filteredRecords.reduce((acc, curr) => acc + (Number(curr.total_biaya) || 0), 0);
        const totalLunas = filteredRecords.filter(r => (r.status_pembayaran || '').toLowerCase().includes('lunas') || (r.status_pembayaran || '').toLowerCase().includes('sudah transfer')).length;
        const totalPending = filteredRecords.filter(r => (r.status_pembayaran || '').toLowerCase().includes('menunggu') || (r.status_pembayaran || '').toLowerCase().includes('belum')).length;

        const periodeLabel = startDateStr === 'all' 
            ? 'Seluruh Riwayat Data'
            : `Mulai Tanggal ${formatTanggalIndo(startDateStr)} ke Depan`;

        const filename = `Backup_Sewa_TMR_${startDateStr}_kedepan.xlsx`;

        // Generate Excel File Buffer
        const excelBuffer = await generateExcelBuffer(filteredRecords, startDateStr, periodeLabel);

        // Jika hanya minta download / check langsung tanpa kirim email (misal via ?mode=download)
        if (req.query.mode === 'download') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.status(200).send(Buffer.from(excelBuffer));
        }

        // Siapkan HTML Body Email yang elegan dan informatif
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
            .content { padding: 28px; }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; }
            .stat-grid { display: table; width: 100%; table-layout: fixed; margin: 20px 0; border-spacing: 10px; }
            .stat-col { display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; text-align: center; }
            .stat-value { font-size: 18px; font-weight: 800; color: #064e3b; margin-top: 4px; }
            .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            .info-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
            .info-table td:first-child { color: #64748b; font-weight: 600; width: 38%; }
            .info-table td:last-child { color: #0f172a; font-weight: 700; }
            .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TAMAN MARGASATWA RAGUNAN</h1>
              <p>Laporan Cadangan (Backup) Data Sewa Fasilitas Otomatis</p>
            </div>
            <div class="content">
              <span class="badge">Jadwal Mingguan: Senin Pagi</span>
              <h2 style="font-size: 18px; margin: 0 0 10px; color: #0f172a;">Halo Pengelola TMR Ragunan,</h2>
              <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
                Terlampir adalah file Excel data cadangan (backup) seluruh reservasi penyewaan fasilitas TMR Ragunan <strong>mulai tanggal ${formatTanggalIndo(startDateStr)} ke depan</strong>.
              </p>

              <div class="stat-grid">
                <div class="stat-col">
                  <div class="stat-label">Total Reservasi</div>
                  <div class="stat-value">${filteredRecords.length} Data</div>
                </div>
                <div class="stat-col">
                  <div class="stat-label">Sudah Transfer</div>
                  <div class="stat-value" style="color: #059669;">${totalLunas}</div>
                </div>
                <div class="stat-col">
                  <div class="stat-label">Total Omset</div>
                  <div class="stat-value" style="color: #0284c7; font-size: 15px;">Rp ${totalNominal.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <table class="info-table">
                <tr>
                  <td>Nama File</td>
                  <td>${filename}</td>
                </tr>
                <tr>
                  <td>Periode Data</td>
                  <td>${periodeLabel}</td>
                </tr>
                <tr>
                  <td>Tanggal Dibuat</td>
                  <td>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' })} WIB</td>
                </tr>
                <tr>
                  <td>Tujuan Email</td>
                  <td>${recipientEmail}</td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; margin-top: 24px; padding: 12px; background: #f1f5f9; border-radius: 12px;">
                💡 <strong>Catatan:</strong> File terlampir berformat <code>.xlsx</code> dan dapat langsung dibuka di Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
              </p>
            </div>
            <div class="footer">
              Email ini dikirim otomatis oleh Sistem Reservasi Fasilitas TMR Ragunan.<br/>
              Jadwal otomatis: Setiap hari Senin pagi pukul 08:00 WIB.
            </div>
          </div>
        </body>
        </html>
        `;

        // Kirim email
        const sendResult = await sendBackupEmail({
            recipient: recipientEmail,
            subject: `[TMR System] Backup Data Sewa Fasilitas - Periode ${startDateStr} ke Depan (${filteredRecords.length} Data)`,
            htmlBody: emailHtml,
            excelBuffer: excelBuffer,
            filename: filename
        });

        return res.status(200).json({
            success: true,
            message: `Backup data (${filteredRecords.length} reservasi) berhasil dikirim ke ${recipientEmail}.`,
            totalData: filteredRecords.length,
            startDate: startDateStr,
            periodeLabel: periodeLabel,
            filename: filename,
            sendResult: sendResult
        });

    } catch (error) {
        console.error("Error running cron backup:", error);

        // Jika error karena belum atur SMTP
        if (error.message.includes('KREDENSIAL_EMAIL_BELUM_DIATUR')) {
            return res.status(400).json({
                success: false,
                requireConfig: true,
                error: error.message,
                guide: {
                    smtp_host: "smtp.gmail.com (port 465)",
                    smtp_user: "Email Gmail Anda yang digunakan untuk mengirim",
                    smtp_pass: "App Password Gmail 16 karakter (dibuat dari akun Google: Security > 2-Step Verification > App passwords)"
                }
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
