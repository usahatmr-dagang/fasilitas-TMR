# Sistem Informasi Manajemen Fasilitas - Taman Margasatwa Ragunan (TMR)

Aplikasi berbasis web untuk mengelola dan reservasi fasilitas di Taman Margasatwa Ragunan (TMR). Dibuat menggunakan React + Vite, TailwindCSS, dan diintegrasikan dengan sistem backend.

## Fitur Utama

- **Reservasi Fasilitas**: Pemesanan harian untuk Pendopo dan Lapangan.
- **Peta Lokasi & Manajemen Fasilitas**: Pemantauan status ketersediaan fasilitas secara real-time.
- **Manajemen Pembayaran**: Pencatatan pembayaran, verifikasi bukti transfer, dan cetak bukti pembayaran.
- **Cetak Penanda & Kwitansi**: Fitur cetak penanda lokasi (format F4 Landscape) dan Kwitansi/Kwitansi Pembayaran (format F4 Portrait).
- **Pemblokiran Maintenance**: Pengaturan administratif untuk memblokir lokasi pada tanggal tertentu guna keperluan pemeliharaan.
- **WhatsApp Integrasi**: Pengiriman struk reservasi otomatis ke nomor WhatsApp penyewa.

## Pengembangan Lokal

1. Pasang dependensi:
   ```bash
   npm install
   ```

2. Jalankan server lokal:
   ```bash
   npm run dev
   ```

3. Bangun proyek untuk produksi:
   ```bash
   npm run build
   ```
