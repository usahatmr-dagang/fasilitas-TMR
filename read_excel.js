const ExcelJS = require('exceljs');

async function readExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./FORM DISPENSASI.xlsx');
  
  console.log('Sheets:', workbook.worksheets.map(ws => ws.name));
  
  const ws = workbook.getWorksheet('DISPENSASI') || workbook.worksheets[0];
  console.log('\n--- Sheet:', ws.name, '---\n');
  
  ws.eachRow({ includeEmpty: true }, function(row, rowNumber) {
    if (rowNumber > 30) return;
    const vals = row.values.slice(1).map(v => typeof v === 'object' && v !== null ? v.result || v.text || JSON.stringify(v) : v);
    console.log(`Row ${rowNumber}:`, vals.join(' | '));
  });
}

readExcel().catch(console.error);
