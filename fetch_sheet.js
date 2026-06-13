const https = require('https');

const sheetId = '1vp2CK15g_ZCSBF29JB_w9kSg8DAZGLTu9Xbgt0jwBfU';
// URL for CSV export
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        const lines = data.split('\n');
        console.log("Total Lines:", lines.length);
        console.log("Headers:", lines[0]);
        console.log("Row 1:", lines[1]);
        console.log("Row 2:", lines[2]);
        console.log("Row 3:", lines[3]);
    });
}).on('error', err => {
    console.error("Error:", err);
});
