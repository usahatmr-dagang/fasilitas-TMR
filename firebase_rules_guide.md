# Panduan Aturan Keamanan Firebase (Security Rules)

Berikut adalah aturan keamanan yang harus Anda pasang di Firebase Console agar halaman publik Anda (yang baru saja kita buat) aman dari pihak yang tidak bertanggung jawab.

Karena API Key web Firebase Anda terekspos ke publik (seperti semua web app React), satu-satunya cara mencegah modifikasi data secara sembarangan adalah menggunakan **Firebase Security Rules**.

---

## 1. Aturan Firestore Database
Buka Firebase Console -> Buka menu **Firestore Database** -> Masuk ke tab **Rules**.
Hapus semua aturan yang ada di sana, dan *copy-paste* kode di bawah ini:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Aturan untuk semua koleksi secara umum
    match /{document=**} {
      // Jika user sudah login (Admin), mereka bebas membaca & menulis semua data.
      allow read, write: if request.auth != null;
    }
    
    // Aturan khusus untuk koleksi sewaList (Penyewaan)
    match /sewaList/{docId} {
      // Mengizinkan pengunjung (publik) untuk MEMBACA HANYA 1 DOKUMEN tertentu.
      // Mereka harus tahu ID dokumen yang panjang & acak (tidak bisa 'list' semua).
      allow get: if true;
      
      // Mengizinkan pengunjung (publik) untuk MENGUPDATE (mengirim bukti).
      // Syaratnya sangat ketat:
      // 1. Status saat ini masih "Belum Transfer" (tidak bisa menimpa yang sudah lunas).
      // 2. Hanya field 'status_pembayaran', 'bukti_transfer', dan 'tanggal_transfer' yang boleh berubah.
      allow update: if 
          resource.data.status_pembayaran == "Belum Transfer" &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status_pembayaran', 'bukti_transfer', 'tanggal_transfer']) &&
          request.resource.data.status_pembayaran == "Menunggu Verifikasi";
    }
  }
}
```

---

## 2. Aturan Firebase Storage
Buka Firebase Console -> Buka menu **Storage** -> Masuk ke tab **Rules**.
Hapus semua aturan yang ada di sana, dan *copy-paste* kode di bawah ini:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Admin bebas akses semuanya
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Publik hanya bisa upload ke folder "bukti_transfer"
    match /bukti_transfer/{fileName} {
      
      // Publik tidak bisa membaca / mendownload gambar ini dari luar aplikasi
      // allow read: if false; 
      
      // Publik hanya bisa upload file JIKA:
      // 1. Ukuran file maksimal 5 MB.
      // 2. Tipe file adalah gambar (image) atau dokumen PDF.
      // 3. File yang diupload belum ada sebelumnya di nama yang sama (mencegah overwrite).
      allow create: if 
        request.resource.size < 5 * 1024 * 1024 && 
        (request.resource.contentType.matches('image/.*') || request.resource.contentType == 'application/pdf');
    }
  }
}
```

---

## Langkah Lanjutan (Sangat Direkomendasikan)
Setelah website Anda live, mohon aktifkan **Firebase App Check** menggunakan **reCAPTCHA Enterprise** di Firebase Console. Hal ini akan memblokir 99% serangan spam bot dari luar browser.
