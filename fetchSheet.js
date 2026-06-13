import https from 'https';
import fs from 'fs';

const sheetId = '1vp2CK15g_ZCSBF29JB_w9kSg8DAZGLTu9Xbgt0jwBfU';
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

console.log("Mengunduh data dari Google Sheets...");

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('./data_utama.csv', data);
        console.log("Data berhasil diunduh dan disimpan sebagai data_utama.csv");
        
        const lines = data.split('\n').map(l => l.trim()).filter(l => l);
        
        console.log("Total baris:", lines.length);
        if (lines.length > 2) {
            console.log("Header:", lines[1]);
            console.log("Contoh Baris 1:", lines[2]);
        }
        console.log("\nSilakan kirimkan 3 baris di atas (Header dan Contoh Baris 1) kepada Antigravity di chat agar sistem dapat melakukan migrasi dengan tepat.");
    });
}).on('error', err => {
    console.error("Gagal mengunduh:", err);
});
