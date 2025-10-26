import XLSX from 'xlsx';

const workbook = XLSX.readFile('AgentInput.xlsx');
const worksheet = workbook.Sheets['Comments'];

// Convert to JSON with different options
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('First row keys:', Object.keys(data[0]));
console.log('\nFirst row data:');
console.log(JSON.stringify(data[0], null, 2));
