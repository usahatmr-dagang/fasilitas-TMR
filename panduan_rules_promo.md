# Aturan Tambahan untuk Fitur Promo TMR

Karena fitur Promo TMR memiliki formulir publik baru yang bisa diisi oleh siapa saja (tanpa login), Anda harus mengizinkan folder dan database baru ini agar bisa diakses oleh publik.

## 1. Aturan Firebase Storage (Penyimpanan Foto/PDF)
Buka Firebase Console -> Buka menu **Storage** -> Masuk ke tab **Rules**.
Tambahkan baris berikut ini ke dalam aturan Anda (sebelum kurung kurawal penutup terakhir):

```javascript
    // Izinkan publik upload bukti transfer untuk Promo TMR (Maks 10MB)
    match /promo_transfers/{fileName} {
      allow create: if request.resource.size < 10 * 1024 * 1024 && 
        (request.resource.contentType.matches('image/.*') || request.resource.contentType == 'application/pdf');
    }
```

## 2. Aturan Firestore Database (Penyimpanan Data Teks)
Buka Firebase Console -> Buka menu **Firestore Database** -> Masuk ke tab **Rules**.
Tambahkan baris berikut ini ke dalam aturan Anda (sebelum kurung kurawal penutup terakhir):

```javascript
    // Izinkan publik mengirim (create) data formulir promo baru
    match /promoList/{document=**} {
      allow create: if true;
    }
```
