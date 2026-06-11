const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./public/kwitansi kosong.xlsx');
  
  const worksheet = workbook.worksheets[0];
  
  worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
    row.eachCell({ includeEmpty: false }, function(cell, colNumber) {
      if (cell.type === ExcelJS.ValueType.String) {
        let val = cell.value;
        if (val.includes('<<Nama PT>>')) {
            cell.value = val.replace('<<Nama PT>>', 'PT. MANTAP JAYA');
            console.log('Replaced Nama PT at', rowNumber, colNumber);
        }
      }
    });
  });

  await workbook.xlsx.writeFile('./scratch/kwitansi_test.xlsx');
  console.log('Done');
}

test().catch(console.error);
