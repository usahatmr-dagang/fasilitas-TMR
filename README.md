# 🐯 Sistem Informasi Manajemen Fasilitas & Promo - Taman Margasatwa Ragunan (TMR)

Aplikasi berbasis web modern untuk mengelola reservasi fasilitas, penyewaan lapak promo, dan administrasi keuangan di Unit Pengelola Taman Margasatwa Ragunan (TMR) secara digital dan terintegrasi penuh.

## 🌟 Teknologi Utama (Tech Stack)
- **Frontend**: React.js + Vite (Cepat & Responsif)
- **Styling**: Tailwind CSS (Desain UI Premium & Modern)
- **Database & Auth**: Firebase Firestore & Firebase Authentication
- **Cloud Storage**: Integrasi Langsung **Google Drive API** untuk dokumen
- **Dokumen Generator**: `docxtemplater` & `pizzip` (Pembuatan DOCX Otomatis)

---

## 🚀 Fitur Unggulan

### 1. 📅 Reservasi Fasilitas Harian (Pendopo & Lapangan)
- **Ketersediaan Publik**: Pengunjung dapat melihat jadwal kosong secara *real-time* sebelum menyewa.
- **Manajemen Admin**: Pencatatan data penyewa, total biaya, dan status pelunasan.
- **Cetak Penanda**: Fitur mencetak papan nama/penanda lokasi secara instan.

### 2. 🎉 Manajemen Event & Promo (TMR Promo Dashboard)
- **Pencatatan Mitra**: Kelola data perusahaan/PT yang menyewa ruang promo.
- **Generator PKS (Perjanjian Kerja Sama)**: Sistem secara otomatis merombak *template* file Word dan **mengunggahnya langsung ke Google Docs/Drive** agar siap diedit bersama oleh tim.
- **Cetak Kwitansi Pintar**: Mencetak kuitansi pembayaran yang presisi menggunakan *HTML Print Media*, dilengkapi nomor referensi otomatis (`KWT-TMR-Tahun-Bulan-Tanggal-xxxx`) dan pengubah angka menjadi "Terbilang" rupiah.

### 3. 💳 Portal Upload Bukti Pembayaran (Self-Service)
- **Keamanan Token**: Penyewa diberi link khusus (mengandung ID Rahasia) untuk mengunggah bukti transfer tanpa perlu *login*.
- **Otomatisasi Kompresi**: Sistem otomatis mengecilkan ukuran gambar (JPG/PNG) di *browser* penyewa sebelum masuk ke server agar irit *storage*.
- **Tanggal Pembayaran**: Input wajib tanggal pembayaran untuk keperluan pembukuan keuangan yang akurat.
- **Verifikasi Bertahap**: Admin akan meninjau bukti yang masuk dan menekan tombol "Verifikasi" di Dashboard.

### 4. 🔒 Sistem Keamanan Ketat (Firebase Rules)
- **Akses Dashboard**: Hanya email Admin TMR yang memiliki akses masuk dan mengubah data (Pencegahan *Unauthorized Access*).
- **Pembatasan Publik**: Pengunjung hanya bisa *membaca* daftar tanggal yang sudah disewa (tanpa melihat detail harga atau nama penyewa lain).
- **Proteksi Portal Upload**: Penyewa hanya bisa memperbarui field `bukti_transfer` dan `tanggal_transfer` miliknya sendiri, dan tidak bisa meretas nominal harganya.

---

## 🛠️ Alur Kerja (Workflow) Operasional

### A. Alur Penyewaan Promo & Cetak PKS
1. Admin memasukkan data PT & produk di **Dashboard Promo**.
2. Klik **Buat & Simpan ke Drive** ➔ Sistem meminta izin sekali ke akun Google Anda.
3. Sistem membuat file PKS baru, menyimpannya di Google Drive Anda, dan langsung membukanya di tab baru.
4. Jika ingin melihatnya lagi di komputer lain, klik **Buka Google Doc**.

### B. Alur Pembayaran Penyewa
1. Admin membagikan Link Upload ke penyewa (Contoh: `fasilitas-tmr.vercel.app/upload/id_rahasia`).
2. Penyewa membuka link, mengisi **Tanggal Pembayaran**, dan mengunggah foto struk.
3. Admin melihat status berubah menjadi **"Menunggu Verifikasi"** di Dashboard.
4. Admin mengeklik tombol **Cetak Bukti Transfer** atau **Kwitansi** sebagai tanda terima resmi.

---

## 💻 Panduan Pengembangan Lokal (Untuk Tim IT)

1. **Pasang dependensi**:
   Pastikan Node.js terinstal, lalu jalankan:
   ```bash
   npm install
   ```

2. **Jalankan Server Lokal**:
   ```bash
   npm run dev
   ```
   Aplikasi bisa dibuka di `http://localhost:5173`.

3. **Deploy ke Server (Vercel)**:
   Aplikasi ini terhubung langsung dengan GitHub. Setiap kali kode baru di-*push* ke cabang `main`, Vercel akan secara otomatis memperbarui website *live*.
   ```bash
   git add .
   git commit -m "Deskripsi pembaruan"
   git push origin main
   ```

---
*Dokumentasi ini akan terus diperbarui seiring dengan penambahan fitur di masa mendatang.*
