# Panduan Mengaktifkan CORS untuk Firebase Storage

Masalah "loading terus-menerus" (stuck) yang Anda alami terjadi karena pengaturan keamanan bawaan (CORS) di server Google Firebase memblokir pengunggahan file dari domain `fasilitas-tmr.vercel.app`. Browser Anda mencegat proses tersebut sehingga sistem tidak bisa memunculkan pesan error maupun melanjutkannya.

Untuk memperbaikinya, kita harus mengizinkan domain Vercel Anda di dalam pengaturan Google Cloud. Caranya sangat mudah, ikuti langkah-langkah ini:

### Langkah 1: Buka Google Cloud Console
1. Buka browser dan pergi ke **[https://console.cloud.google.com/](https://console.cloud.google.com/)**
2. Pastikan Anda **Login** menggunakan akun Google yang sama dengan yang Anda gunakan untuk Firebase.

### Langkah 2: Pilih Proyek Anda
1. Di bagian atas halaman (sebelah logo Google Cloud), klik **menu dropdown nama proyek** (biasanya bertuliskan "Select a project").
2. Pilih proyek Firebase Anda, yaitu **`fasilitas-tmr`**.

### Langkah 3: Buka Cloud Shell (Terminal Bawaan)
1. Di sudut kanan atas layar, cari ikon **Activate Cloud Shell** (ikon berbentuk kotak terminal kecil `>_`). Klik ikon tersebut.
2. Jendela terminal hitam akan muncul di bagian bawah layar Anda. Tunggu beberapa detik sampai terminal siap digunakan (muncul nama username Anda).

### Langkah 4: Buat File Konfigurasi
1. Di dalam terminal hitam tersebut, **Copy-Paste** kode berikut ini lalu tekan **Enter**:
```bash
echo '[{"origin": ["*"],"method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],"maxAgeSeconds": 3600}]' > cors.json
```
*(Ini akan membuat sebuah file kecil bernama `cors.json` yang berisi aturan izin).*

### Langkah 5: Terapkan Aturan ke Firebase Storage Anda
1. Terakhir, **Copy-Paste** perintah berikut ini lalu tekan **Enter**:
```bash
gcloud storage buckets update gs://fasilitas-tmr.firebasestorage.app --cors-file=cors.json
```
2. Jika ada pesan konfirmasi otorisasi (Authorize), klik tombol **Authorize / Izinkan**.

---

**Selesai!** Pengaturan akan langsung aktif.
Silakan kembali ke halaman **fasilitas-tmr.vercel.app/upload**, lalu coba unggah file Anda lagi. Seharusnya sekarang file akan langsung terunggah dalam hitungan detik!
