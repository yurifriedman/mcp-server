import XLSX from 'xlsx';

const workbook = XLSX.readFile('AgentInput.xlsx');
const sheetNames = workbook.SheetNames;

console.log('Excel File Analysis:');
console.log('===================\n');

sheetNames.forEach(sheetName => {
  console.log(`Sheet: ${sheetName}`);
  console.log('-'.repeat(50));

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  jsonData.forEach((row, index) => {
    console.log(`Row ${index + 1}:`, JSON.stringify(row));
  });

  console.log('\n');
});
