import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Download, Search, X, Loader2, Info, Settings, Save, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// PizZip and Docxtemplater for docx generation
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Konversi angka ke teks (Terbilang)
const terbilang = (angka) => {
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let hasil = "";
    if (angka < 12) hasil = huruf[angka];
    else if (angka < 20) hasil = terbilang(angka - 10) + " Belas";
    else if (angka < 100) hasil = terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    else if (angka < 200) hasil = "Seratus " + terbilang(angka - 100);
    else if (angka < 1000) hasil = terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    else if (angka < 2000) hasil = "Seribu " + terbilang(angka - 1000);
    else if (angka < 1000000) hasil = terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    else if (angka < 1000000000) hasil = terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    else if (angka < 1000000000000) hasil = terbilang(Math.floor(angka / 1000000000)) + " Milyar " + terbilang(angka % 1000000000);
    return hasil.trim();
};

const properCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const getMonthDays = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function PromoDashboard({ onNavigate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [promoList, setPromoList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [viewMode, setViewMode] = useState('promo'); // 'promo' or 'transfer'
  const [isGenerating, setIsGenerating] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const CLIENT_ID = '905355425334-tbtvuvufgvnom6vnlb5d0rka00ih03if.apps.googleusercontent.com';

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [tarif, setTarif] = useState({ hargaTitik: 1000000, hargaBanner: 100000 });
  const [tarifForm, setTarifForm] = useState({ hargaTitik: 1000000, hargaBanner: 100000 });
  const [isSavingTarif, setIsSavingTarif] = useState(false);

  // Edit State
  const [editingPromo, setEditingPromo] = useState(null);
  const [editForm, setEditForm] = useState({
    namaPerusahaan: '',
    namaProduk: '',
    jumlahTitik: '',
    jumlahBanner: '',
    jumlahTransfer: '',
    tanggalTransfer: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    // Fetch Promos
    const unsub = onSnapshot(collection(db, 'promoList'), (snapshot) => {
      const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromoList(promos);
      setIsLoading(false);
    });

    // Fetch Tarif
    const fetchTarif = async () => {
      try {
        const docRef = doc(db, 'masterTarif', 'promo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTarif(docSnap.data());
          setTarifForm(docSnap.data());
        }
      } catch (err) {
        console.error("Gagal mengambil tarif:", err);
      }
    };
    fetchTarif();

    // Inisialisasi Google API Client
    if (window.gapi) {
        window.gapi.load('client', () => {});
    }

    return () => unsub();
  }, []);

  const requestGoogleToken = () => {
      return new Promise((resolve, reject) => {
          if (googleAccessToken) {
              resolve(googleAccessToken);
              return;
          }
          if (!window.google) {
              reject(new Error("Google Script belum dimuat. Silakan muat ulang halaman."));
              return;
          }
          const client = window.google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/drive.file',
              callback: (response) => {
                  if (response.error) {
                      reject(response.error);
                  } else {
                      setGoogleAccessToken(response.access_token);
                      resolve(response.access_token);
                  }
              },
          });
          client.requestAccessToken();
      });
  };

  const uploadToGoogleDrive = async (blob, fileName, promoId) => {
      try {
          const token = await requestGoogleToken();
          
          const metadata = {
              name: fileName,
              mimeType: 'application/vnd.google-apps.document', // Auto convert to Google Docs
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', blob);

          const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: new Headers({ 'Authorization': 'Bearer ' + token }),
              body: form,
          });

          if (!response.ok) {
              throw new Error("Gagal mengunggah ke Google Drive");
          }
          const result = await response.json();
          const fileId = result.id;
          
          // Ubah izin akses file agar siapa saja yang memiliki link bisa mengeditnya
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
              method: 'POST',
              headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  role: 'writer',
                  type: 'anyone'
              })
          });

          // Get webViewLink (bisa juga kita generate langsung linknya)
          const docUrl = `https://docs.google.com/document/d/${fileId}/edit`;
          
          // Simpan link ke firebase
          await updateDoc(doc(db, 'promoList', promoId), {
              pksDriveUrl: docUrl
          });

          return docUrl;
      } catch (error) {
          console.error("Drive Error:", error);
          throw error;
      }
  };

  const handleSaveTarif = async () => {
    setIsSavingTarif(true);
    try {
      await setDoc(doc(db, 'masterTarif', 'promo'), {
        hargaTitik: parseInt(tarifForm.hargaTitik) || 0,
        hargaBanner: parseInt(tarifForm.hargaBanner) || 0
      });
      setTarif({
        hargaTitik: parseInt(tarifForm.hargaTitik) || 0,
        hargaBanner: parseInt(tarifForm.hargaBanner) || 0
      });
      setShowSettings(false);
      alert('Harga promo berhasil diperbarui!');
    } catch(err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan harga.');
    } finally {
      setIsSavingTarif(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const daysInMonth = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const blanks = Array(firstDayOfMonth).fill(null);

  const getPromosForDate = (date) => {
    const targetDateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return promoList.filter(promo => {
        if (viewMode === 'promo') {
            if (promo.selectedDates && Array.isArray(promo.selectedDates)) {
                return promo.selectedDates.some(d => typeof d === 'object' && d !== null ? d.date === targetDateStr : d === targetDateStr);
            }
            // Fallback for old string-based data
            const dayString = String(date.getDate());
            return promo.tanggalPromo?.includes(dayString) && promo.tanggalPromo?.toLowerCase().includes(monthNames[date.getMonth()].toLowerCase());
        } else {
            if (!promo.tanggalTransfer) return false;
            return promo.tanggalTransfer === targetDateStr;
        }
    });
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const handleGenerateBuktiTransfer = (promo) => {
    const htmlContent = `
      <html>
        <head>
          <title>Bukti Transfer - ${promo.namaPerusahaan}</title>
          <style>
            @page { size: 215mm 330mm portrait; margin: 20mm; }
            body { font-family: 'Arial', sans-serif; font-size: 12pt; line-height: 1.5; color: #000; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20pt; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 12pt; }
            .content-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .content-table td { padding: 8px 0; vertical-align: top; }
            .label { width: 35%; font-weight: bold; }
            .colon { width: 5%; text-align: center; font-weight: bold; }
            .value { width: 60%; }
            .image-container { text-align: center; margin-top: 30px; border: 2px dashed #ccc; padding: 10px; }
            .image-container img { max-width: 100%; max-height: 400px; object-fit: contain; }
            .footer { margin-top: 40px; text-align: right; font-size: 10pt; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BUKTI TRANSFER PROMO TMR</div>
            <div class="subtitle">Unit Pengelola Taman Margasatwa Ragunan</div>
          </div>
          
          <table class="content-table">
            <tr>
              <td class="label">Tanggal Transfer</td>
              <td class="colon">:</td>
              <td class="value">${promo.tanggalTransfer || '-'}</td>
            </tr>
            <tr>
              <td class="label">Nama Perusahaan (PT)</td>
              <td class="colon">:</td>
              <td class="value">${properCase(promo.namaPerusahaan) || '-'}</td>
            </tr>
            <tr>
              <td class="label">Jenis Produk</td>
              <td class="colon">:</td>
              <td class="value">${promo.namaProduk || '-'}</td>
            </tr>
            <tr>
              <td class="label">Tanggal Pelaksanaan Promo</td>
              <td class="colon">:</td>
              <td class="value">${promo.tanggalPromo || '-'}</td>
            </tr>
            <tr>
              <td class="label">Nominal Transfer</td>
              <td class="colon">:</td>
              <td class="value" style="font-weight: bold; color: #059669;">Rp ${promo.jumlahTransfer || '0'}</td>
            </tr>
          </table>

          ${promo.buktiTransferUrl ? `
          <div class="image-container">
            <p style="font-weight: bold; margin-bottom: 10px; text-align: left;">Lampiran Foto Bukti Transfer:</p>
            <img src="${promo.buktiTransferUrl}" alt="Bukti Transfer" />
          </div>
          ` : ''}

          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=900,height=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleGenerateKwitansi = (promo) => {
    // Determine sequential number from promoList index
    const promoIndex = promoList.findIndex(p => p.id === promo.id);
    const seqNum = String(promoIndex + 1).padStart(4, '0');
    
    // Parse tanggal transfer
    const tglArr = (promo.tanggalTransfer || '').split('-');
    const tahun = tglArr[0] || new Date().getFullYear();
    const bulan = tglArr[1] || String(new Date().getMonth() + 1).padStart(2, '0');
    const tanggal = tglArr[2] || String(new Date().getDate()).padStart(2, '0');
    
    const noRef = `KWT-TMR-${tahun}-${bulan}-${tanggal}-${seqNum}`;

    // Get signature date text
    const dateObj = promo.tanggalTransfer ? new Date(promo.tanggalTransfer) : new Date();
    const tanggalStr = dateObj.getDate();
    const bulanStr = monthNames[dateObj.getMonth()];
    const tahunStr = dateObj.getFullYear();

    // Parse nominal transfer
    const nominalNumeric = promo.jumlahTransferNumeric || parseInt(String(promo.jumlahTransfer).replace(/\D/g, ''), 10) || 0;
    
    const rpAmount = formatRupiah(nominalNumeric);
    const textTerbilang = terbilang(nominalNumeric) + " Rupiah";

    const printWindow = window.open('', '', 'width=900,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Kwitansi - ${promo.namaPerusahaan}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; box-sizing: border-box; }
            .kwitansi-container {
              border: 2px solid #000;
              width: 100%;
              max-width: 1000px;
              height: auto;
              min-height: 400px;
              margin: 0 auto;
              position: relative;
              display: flex;
              box-sizing: border-box;
            }
            .left-pane {
              width: 120px;
              border-right: 2px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              padding: 10px;
            }
            .left-pane-text {
              transform: rotate(-90deg);
              white-space: nowrap;
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              line-height: 1.2;
              letter-spacing: 1px;
            }
            .right-pane {
              flex: 1;
              padding: 30px 40px;
              display: flex;
              flex-direction: column;
            }
            .row {
              display: flex;
              margin-bottom: 12px;
              font-size: 16px;
              align-items: flex-end;
            }
            .label {
              width: 180px;
              font-style: italic;
              flex-shrink: 0;
            }
            .value {
              flex: 1;
              border-bottom: 2px dotted #000;
              padding-bottom: 2px;
              font-weight: bold;
              min-height: 20px;
            }
            .value-multi {
              flex: 1;
              border-bottom: 2px dotted #000;
              padding-bottom: 2px;
              font-weight: bold;
              line-height: 1.8;
              position: relative;
            }
            /* Extra line to simulate empty space on multi-line text */
            .value-multi::after {
              content: '';
              display: block;
              width: 100%;
              border-bottom: 2px dotted #000;
              margin-top: 25px;
            }
            .bottom-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .amount-box {
              font-size: 20px;
              font-weight: bold;
              font-style: italic;
              border-bottom: 4px double #000;
              padding-bottom: 2px;
              margin-left: 20px;
            }
            .signature-box {
              text-align: center;
              width: 300px;
            }
            .signature-date {
              margin-bottom: 70px;
              font-size: 16px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="kwitansi-container">
            <div class="left-pane">
              <!-- Anda bisa menyisipkan tag <img> logo TMR / Jakarta di sini jika diperlukan -->
              <div class="left-pane-text">
                PEMERINTAH PROVINSI<br/>
                DAERAH KHUSUS IBUKOTA<br/>
                JAKARTA<br/>
                TAMAN MARGASATWA<br/>
                RAGUNAN<br/>
                ZOOLOGICAL PARK
              </div>
            </div>
            
            <div class="right-pane">
              <div class="row" style="justify-content: flex-end; font-size: 14px;">
                <strong>No. Ref: ${noRef}</strong>
              </div>
              <div class="row" style="margin-top: 10px;">
                <div class="label">Sudah terima dari</div>
                <div class="value">${properCase(promo.namaPerusahaan)}</div>
              </div>
              <div class="row">
                <div class="label">Terbilang</div>
                <div class="value" style="font-style: italic;"># ${textTerbilang} #</div>
              </div>
              <div class="row" style="align-items: flex-start;">
                <div class="label" style="padding-top: 2px;">Untuk pembayaran</div>
                <div class="value-multi">
                  Penjualan produk / event promo ${promo.namaProduk} selama ${promo.jumlahHari} hari, pada tanggal ${promo.tanggalPromo} di UP Taman Margasatwa Ragunan melalui transfer ${rpAmount} dengan No.ref ${noRef}
                </div>
              </div>
              
              <div class="bottom-section">
                <div class="amount-box">
                  ${rpAmount},00
                </div>
                <div class="signature-box">
                  <div class="signature-date">Jakarta, ${tanggalStr} ${bulanStr} ${tahunStr}</div>
                  <div class="signature-line"></div>
                </div>
              </div>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleGenerateSurat = async (promo) => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(today);
      const tanggal = String(today.getDate()).padStart(2, '0');
      const bulan = monthNames[today.getMonth()];
      const tahun = today.getFullYear();
      
      const nominalNumeric = promo.jumlahTransferNumeric || parseInt(String(promo.jumlahTransfer).replace(/\D/g, ''), 10) || 0;
      const terbilangText = terbilang(nominalNumeric);

      const formatDatesGroup = (dateStrings) => {
          const byMonthYear = {};
          dateStrings.forEach(dStr => {
              const [y, m, d] = dStr.split('-');
              const my = `${monthNames[parseInt(m)-1]} ${y}`;
              if (!byMonthYear[my]) byMonthYear[my] = [];
              byMonthYear[my].push(parseInt(d));
          });
          const monthParts = [];
          for (const [my, days] of Object.entries(byMonthYear)) {
              days.sort((a, b) => a - b);
              if (days.length === 1) {
                  monthParts.push(`${days[0]} ${my}`);
              } else if (days.length === 2) {
                  monthParts.push(`${days[0]}, dan ${days[1]} ${my}`);
              } else {
                  const last = days.pop();
                  monthParts.push(`${days.join(', ')}, dan ${last} ${my}`);
              }
          }
          if (monthParts.length === 1) return monthParts[0];
          if (monthParts.length === 2) return `${monthParts[0]} dan ${monthParts[1]}`;
          const lastPart = monthParts.pop();
          return `${monthParts.join(', ')} dan ${lastPart}`;
      };

      let tanggalMurni = promo.tanggalPromo;
      if (promo.selectedDates && Array.isArray(promo.selectedDates)) {
          const validItems = promo.selectedDates.filter(d => typeof d === 'object' && d !== null ? d.date : d);
          if (validItems.length > 0) {
               const dateStrings = validItems.map(d => typeof d === 'object' && d !== null ? d.date : d);
               tanggalMurni = formatDatesGroup(dateStrings);
          }
      }

      // 1. Fetch template
      const response = await fetch('/Perjanjian Kerja Sama.docx');
      if (!response.ok) throw new Error('Gagal mengambil template Perjanjian Kerja Sama.docx');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // 2. Setup PizZip and Docxtemplater
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { 
          paragraphLoop: true, 
          linebreaks: true,
          delimiters: { start: '<<', end: '>>' }
      });

      const data = {
          hari: hari,
          tanggal: tanggal,
          bulan: bulan,
          tahun: tahun,
          "tanggal transfer": promo.tanggalTransfer || "-",
          "Nama proper": properCase(promo.namaPenandaTangan),
          "PT proper": properCase(promo.namaPerusahaan),
          produk: promo.namaProduk,
          "lama hari": promo.jumlahHari,
          "tanggal promo": promo.tanggalPromo,
          "tanggal murni": tanggalMurni,
          "detail titik": promo.tanggalPromo,
          "jumlah transfer": promo.jumlahTransfer,
          "terbilang transfer": terbilangText,
          "jumlah titik": promo.jumlahTitik,
          " banner": promo.jumlahBanner || "0",
          "PT gede": (promo.namaPerusahaan || '').toUpperCase(),
          "Nama Penanda Tangan gede": (promo.namaPenandaTangan || '').toUpperCase()
      };

      // 4. Render and Save
      doc.render(data);
      const outBuffer = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const safeName = (promo.namaPerusahaan || 'TMR').replace(/[^a-zA-Z0-9]/g, '_');
      const finalFileName = `SPK_Promo_${safeName}`;
      
      // Upload ke Google Drive
      const url = await uploadToGoogleDrive(outBuffer, finalFileName, promo.id);
      
      // Tutup loading form, lalu buka link
      setIsGenerating(false);
      window.open(url, '_blank');
      
      
    } catch (error) {
      console.error(error);
      alert('Gagal membuat surat perjanjian. Pastikan template .docx berada di folder public (e.g. /Perjanjian Kerja Sama.docx) dan variabel format sesuai (e.g. <<Nama proper>>)');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintBukti = () => {
    if (!selectedPromo || !selectedPromo.buktiTransferUrl) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Bukti Transfer Promo - ${selectedPromo.namaPerusahaan}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { 
              font-family: 'Arial', sans-serif; 
              background-color: #ffffff; 
              margin: 0; 
              padding: 0; 
              overflow: hidden; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .print-container {
              width: 100%;
              padding: 15mm;
              box-sizing: border-box;
              border: 5px solid #059669; 
              background-color: #f0fdf4; 
              min-height: 297mm;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #059669;
              padding-bottom: 5mm;
              margin-bottom: 5mm;
            }
            .header h1 { font-size: 24px; color: #064e3b; margin: 0; font-weight: 900; }
            .header h2 { font-size: 16px; color: #059669; margin: 5px 0 0 0; letter-spacing: 2px; }
            .details {
              font-size: 12pt;
              color: #064e3b;
              margin-bottom: 10mm;
              line-height: 1.5;
            }
            .details table { width: 100%; border-collapse: collapse; }
            .details td { padding: 4px 0; vertical-align: top; }
            .details td:first-child { font-weight: bold; width: 180px; }
            .image-container {
              display: flex;
              justify-content: center;
              align-items: center;
              border: 2px dashed #059669;
              padding: 5mm;
              background-color: #ffffff;
            }
            .image-container img { max-width: 100%; max-height: 150mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>TAMAN MARGASATWA RAGUNAN</h1>
              <h2>BUKTI TRANSFER PROMO</h2>
            </div>
            
            <div class="details">
              <table>
                <tr><td>Nama Perusahaan / PT</td><td>: <b>${selectedPromo.namaPerusahaan}</b></td></tr>
                <tr><td>Jenis Produk</td><td>: ${selectedPromo.namaProduk}</td></tr>
                <tr><td>Tanggal Pelaksanaan</td><td>: ${selectedPromo.tanggalPromo}</td></tr>
                <tr><td>Tanggal Transfer</td><td>: ${selectedPromo.tanggalTransfer || '-'}</td></tr>
                <tr><td>Nominal Transfer</td><td>: Rp ${selectedPromo.jumlahTransfer}</td></tr>
              </table>
            </div>

            <div class="image-container">
              <img src="${selectedPromo.buktiTransferUrl}" alt="Bukti Transfer Promo" />
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 800); 
  };

  const handleVerifikasi = async (id) => {
      try {
          await updateDoc(doc(db, 'promoList', id), { status: 'Terverifikasi' });
      } catch (err) {
          console.error(err);
          alert('Gagal memverifikasi');
      }
  };

  const handleDelete = async (id, namaPerusahaan) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data promo untuk PT ${namaPerusahaan}?`)) {
      try {
        await deleteDoc(doc(db, 'promoList', id));
      } catch (err) {
        console.error("Gagal menghapus data:", err);
        alert("Gagal menghapus data promo.");
      }
    }
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setEditForm({
      namaPerusahaan: promo.namaPerusahaan || '',
      namaProduk: promo.namaProduk || '',
      jumlahTitik: promo.jumlahTitik || '',
      jumlahBanner: promo.jumlahBanner || '',
      jumlahTransfer: promo.jumlahTransfer || '',
      tanggalTransfer: promo.tanggalTransfer || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPromo) return;
    setIsSavingEdit(true);
    try {
      const docRef = doc(db, 'promoList', editingPromo.id);
      await updateDoc(docRef, {
        namaPerusahaan: editForm.namaPerusahaan,
        namaProduk: editForm.namaProduk,
        jumlahTitik: editForm.jumlahTitik,
        jumlahBanner: editForm.jumlahBanner,
        jumlahTransfer: editForm.jumlahTransfer,
        tanggalTransfer: editForm.tanggalTransfer
      });
      setEditingPromo(null);
    } catch (err) {
      console.error("Gagal mengupdate data:", err);
      alert("Gagal menyimpan perubahan data.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderSidebar = () => {
    if (!selectedPromo && !selectedDate) {
      return (
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-emerald-100 flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mb-4">
            <Info size={40} />
          </div>
          <h3 className="text-lg font-bold text-emerald-900 mb-2">Pilih Jadwal</h3>
          <p className="text-sm font-semibold text-emerald-700/60">Klik pada tanggal kalender yang memiliki indikator promo untuk melihat detail dan mencetak surat perjanjian.</p>
        </div>
      );
    }

    const promosToDisplay = selectedDate ? getPromosForDate(selectedDate) : [selectedPromo];
    if (!promosToDisplay || promosToDisplay.length === 0) return null;

    const totalPT = promosToDisplay.length;
    const totalTitik = promosToDisplay.reduce((sum, p) => sum + (parseInt(p?.jumlahTitik) || 1), 0);
    const totalBanner = promosToDisplay.reduce((sum, p) => sum + (parseInt(p?.jumlahBanner) || 0), 0);

    return (
      <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4">
        <div className="p-6 bg-emerald-50/50 border-b border-emerald-100 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-3 bg-emerald-200 text-emerald-800">
              {selectedDate ? (viewMode === 'transfer' ? `Jadwal Transfer: ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`) : 'Promo > 20 Hari'}
            </div>
            <h2 className="text-xl font-black text-emerald-950">
              {viewMode === 'promo' ? `Total ${totalPT} Mitra` : `Transfer: ${totalPT} Mitra`}
            </h2>
            {viewMode === 'promo' && (
              <p className="text-sm font-semibold text-emerald-700">Total: {totalTitik} Titik, {totalBanner} Banner</p>
            )}
          </div>
          <button onClick={() => { setSelectedPromo(null); setSelectedDate(null); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {promosToDisplay.map((p, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-emerald-950 text-lg">{p?.namaPerusahaan || '-'}</h3>
                  <p className="text-sm font-semibold text-emerald-700">{p?.namaProduk || '-'}</p>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${p?.status === 'Terverifikasi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p?.status || 'Belum Verifikasi'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Titik Lokasi</span>
                  <span className="text-sm font-bold text-slate-800">{p?.jumlahTitik || 1} Titik</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Jumlah Banner</span>
                  <span className="text-sm font-bold text-slate-800">{p?.jumlahBanner || 0} Buah</span>
                </div>
                
                {viewMode === 'transfer' && (
                  <>
                    <div className="bg-slate-50 p-2 rounded-lg col-span-2 flex justify-between items-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Tanggal Transfer</span>
                      <span className="text-sm font-bold text-slate-800">{p?.tanggalTransfer || '-'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg col-span-2 flex justify-between items-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Tanggal Pelaksanaan</span>
                      <span className="text-sm font-bold text-slate-800">{p?.tanggalPromo || '-'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg col-span-2 flex justify-between items-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Nominal Transfer</span>
                      <span className="text-sm font-black text-emerald-600">Rp {p?.jumlahTransfer || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {viewMode === 'transfer' && p?.buktiTransferUrl && (
                <div className="mb-4">
                  <a href={p.buktiTransferUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 hover:shadow-sm">
                    <div className="h-24 bg-cover bg-center" style={{backgroundImage: `url(${p.buktiTransferUrl})`}}></div>
                  </a>
                </div>
              )}

              <div className="space-y-2 mt-4">
                {p?.status !== 'Terverifikasi' && (
                  <button onClick={() => handleVerifikasi(p.id)} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                    <CheckCircle2 size={16} /> Verifikasi
                  </button>
                )}
                
                {viewMode === 'transfer' && (
                  <>
                    {p.pksDriveUrl ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => window.open(p.pksDriveUrl, '_blank')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        >
                          Buka Google Doc
                        </button>
                        <button 
                          onClick={() => handleGenerateSurat(p)}
                          disabled={isGenerating}
                          className="w-full py-2 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        >
                          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          Buat Ulang PKS
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleGenerateSurat(p)}
                        disabled={isGenerating}
                        className="w-full py-2 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                      >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Buat & Simpan ke Drive
                      </button>
                    )}

                    <div class="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleGenerateBuktiTransfer(p)}
                        disabled={isGenerating}
                        className="w-full py-2 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                      >
                        <Download size={16} /> Bukti Transfer
                      </button>

                      <button 
                        onClick={() => handleGenerateKwitansi(p)}
                        disabled={isGenerating}
                        className="w-full py-2 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                      >
                        <Download size={16} /> Kwitansi
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button 
                        onClick={() => openEditModal(p)}
                        className="w-full py-2 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all"
                      >
                        <Edit size={16} /> Edit Data
                      </button>

                      <button 
                        onClick={() => handleDelete(p.id, p.namaPerusahaan)}
                        className="w-full py-2 bg-white border-2 border-rose-500 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all"
                      >
                        <Trash2 size={16} /> Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#F4F7F4] flex flex-col h-screen overflow-hidden">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-xl max-w-md w-full animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                <Settings className="text-emerald-600" size={24} /> Pengaturan Harga
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Harga 1 Titik Promo / Hari (Rp)</label>
                <input 
                  type="number" 
                  value={tarifForm.hargaTitik} 
                  onChange={(e) => setTarifForm({...tarifForm, hargaTitik: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-700 focus:border-emerald-500 focus:ring-0" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Harga 1 Banner / Hari (Rp)</label>
                <input 
                  type="number" 
                  value={tarifForm.hargaBanner} 
                  onChange={(e) => setTarifForm({...tarifForm, hargaBanner: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-700 focus:border-emerald-500 focus:ring-0" 
                />
              </div>
            </div>

            <button 
              onClick={handleSaveTarif}
              disabled={isSavingTarif}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all"
            >
              {isSavingTarif ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Edit Promo Modal */}
      {editingPromo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-xl max-w-lg w-full animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                <Edit className="text-emerald-600" size={24} /> Edit Data Promo
              </h3>
              <button onClick={() => setEditingPromo(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Perusahaan (PT)</label>
                <input 
                  type="text" 
                  value={editForm.namaPerusahaan} 
                  onChange={(e) => setEditForm({...editForm, namaPerusahaan: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-900 focus:border-emerald-500 focus:ring-0" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Produk</label>
                <input 
                  type="text" 
                  value={editForm.namaProduk} 
                  onChange={(e) => setEditForm({...editForm, namaProduk: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-900 focus:border-emerald-500 focus:ring-0" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah Titik</label>
                  <input 
                    type="number" 
                    value={editForm.jumlahTitik} 
                    onChange={(e) => setEditForm({...editForm, jumlahTitik: e.target.value})}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-900 focus:border-emerald-500 focus:ring-0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah Banner</label>
                  <input 
                    type="number" 
                    value={editForm.jumlahBanner} 
                    onChange={(e) => setEditForm({...editForm, jumlahBanner: e.target.value})}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-900 focus:border-emerald-500 focus:ring-0" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tgl Transfer</label>
                  <input 
                    type="date" 
                    value={editForm.tanggalTransfer} 
                    onChange={(e) => setEditForm({...editForm, tanggalTransfer: e.target.value})}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-900 focus:border-emerald-500 focus:ring-0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                  <input 
                    type="number" 
                    value={editForm.jumlahTransfer} 
                    onChange={(e) => setEditForm({...editForm, jumlahTransfer: e.target.value})}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-emerald-900 focus:border-emerald-500 focus:ring-0" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all"
            >
              {isSavingEdit ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-8 py-5 border-b border-emerald-100 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')} 
            className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
            title="Kembali ke Menu Utama"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-emerald-950 flex items-center gap-3">
              <CalendarIcon size={28} className="text-emerald-600" />
              Dashboard Promo TMR
            </h1>
            <p className="text-sm font-semibold text-emerald-700/70 mt-1">Kelola jadwal promosi dan selling pengunjung di area Taman Margasatwa Ragunan.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-all border border-emerald-200"
        >
          <Settings size={18} /> Pengaturan Harga
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
          </div>
        ) : (
          <div className="flex gap-8 max-w-7xl mx-auto h-full items-start">
            
            {/* Calendar Section */}
            <div className="flex-1 bg-white rounded-3xl shadow-lg border border-emerald-100 p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">Jadwal TMR</h2>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setViewMode('promo')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${viewMode === 'promo' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                    >
                      Jadwal Promo
                    </button>
                    <button 
                      onClick={() => setViewMode('transfer')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${viewMode === 'transfer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                    >
                      Jadwal Transfer
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={prevMonth} className="p-2 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-black text-emerald-800 text-lg min-w-[150px] text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button onClick={nextMonth} className="p-2 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center font-bold text-xs uppercase tracking-wider text-emerald-600/70 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr min-h-0">
                {blanks.map((_, i) => (
                  <div key={`blank-${i}`} className="bg-slate-50/50 rounded-2xl border border-transparent"></div>
                ))}
                {daysInMonth.map((date, i) => {
                  const promos = getPromosForDate(date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  
                  return (
                    <div 
                      key={i} 
                      className={`rounded-xl border p-1.5 flex flex-col transition-all cursor-pointer h-full min-h-0 ${isToday ? 'bg-emerald-50 border-emerald-300 shadow-inner' : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'}`}
                      onClick={() => {
                        if (promos.length > 0) {
                          setSelectedDate(date);
                          setSelectedPromo(null);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center shrink-0 mb-0.5">
                        <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}>
                          {date.getDate()}
                        </span>
                        {promos.length > 0 && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shadow-sm">
                            {promos.reduce((sum, p) => sum + (parseInt(p?.jumlahTitik) || 1), 0)} Titik
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                        {promos.map((p, idx) => (
                          <div key={idx} className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 leading-[1.1] ${p.status === 'Terverifikasi' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            <div className="truncate">{p.namaPerusahaan}</div>
                            <div className="truncate font-medium opacity-80">{p.namaProduk}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Section Promo Tanpa Tanggal (> 20 Hari) */}
              {promoList.filter(p => p.selectedDates && p.selectedDates.length === 0 && p.tanggalPromo === 'tanggal ditentukan kemudian').length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Promo &gt; 20 Hari (Menunggu Penentuan Tanggal)</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {promoList.filter(p => p.selectedDates && p.selectedDates.length === 0 && p.tanggalPromo === 'tanggal ditentukan kemudian').map((p, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => { setSelectedPromo(p); setSelectedDate(null); }}
                        className="min-w-[200px] bg-amber-50 border border-amber-200 p-3 rounded-xl cursor-pointer hover:shadow-md hover:border-amber-400 transition-all"
                      >
                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase inline-block mb-1 ${p.status === 'Terverifikasi' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                          {p.status}
                        </div>
                        <h4 className="text-sm font-black text-amber-950 truncate">{p.namaPerusahaan}</h4>
                        <p className="text-xs font-semibold text-amber-800">{p.jumlahHari} Hari</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="w-[400px] h-full flex flex-col">
              {renderSidebar()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
