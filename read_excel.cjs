const ExcelJS = require('exceljs');
const fs = require('fs');

async function readExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./FORM DISPENSASI.xlsx');
  
  let output = '=== DAFTAR SHEET ===\n';
  workbook.worksheets.forEach(ws => {
    output += `- ${ws.name}\n`;
  });
  output += '\n\n';
  
  for (const ws of workbook.worksheets) {
    output += `\n--- Sheet: ${ws.name} ---\n\n`;
    ws.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber > 50) return;
      const vals = row.values.slice(1).map(v => typeof v === 'object' && v !== null ? v.result || v.text || JSON.stringify(v) : v);
      output += `Baris ${rowNumber}: ${vals.join(' | ')}\n`;
    });
  }
  
  fs.writeFileSync('./hasil_dispensasi.txt', output);
  console.log('Selesai! Hasil disimpan di hasil_dispensasi.txt');
}

readExcel().catch(console.error);
