export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nama, fasilitas, tanggal, waktuMulai, waktuSelesai, tujuan } = req.body;

    // Simulasi jeda jaringan agar efek loading terlihat di UI
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Validasi sederhana
    if (!nama || !fasilitas || !tanggal || !waktuMulai || !waktuSelesai || !tujuan) {
      return res.status(400).json({ error: 'Semua field (nama, fasilitas, tanggal, waktu, tujuan) harus diisi.' });
    }

    // Validasi tanggal tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sewaDate = new Date(tanggal);
    if (sewaDate < today) {
      return res.status(400).json({ error: 'Tanggal sewa tidak boleh di masa lalu.' });
    }

    // Validasi waktu
    if (waktuMulai >= waktuSelesai) {
      return res.status(400).json({ error: 'Waktu selesai harus setelah waktu mulai.' });
    }

    // Di sini kita bisa menyimpan ke database.
    // Sebagai contoh, kita sukseskan saja dan kembalikan data.
    
    return res.status(200).json({ 
      message: `Penyewaan ${fasilitas} pada ${tanggal} jam ${waktuMulai}-${waktuSelesai} atas nama ${nama} berhasil diajukan!` 
    });
  } else {
    // Hanya menerima method POST
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Tidak Diizinkan` });
  }
}
