import XLSX from 'xlsx';

const workbook = XLSX.readFile('AgentInput.xlsx');
const worksheet = workbook.Sheets['Comments'];

if (!worksheet) {
  console.error('Comments sheet not found!');
  process.exit(1);
}

// Convert to JSON (skip header row)
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('═══════════════════════════════════════════════════════════════');
console.log('           MAY 2025 REVENUE CALCULATION');
console.log('═══════════════════════════════════════════════════════════════\n');

let mayTotal = 0;
let juneTotal = 0;

console.log('CLIENT BREAKDOWN:\n');
console.log('Client'.padEnd(25) + 'May Revenue'.padEnd(20) + 'June Revenue');
console.log('-'.repeat(65));

data.forEach(row => {
  const client = row.Client || 'Unknown';
  const mayRevenue = parseFloat(row['May-25']) || 0;
  const juneRevenue = parseFloat(row['Jun-25']) || 0;

  mayTotal += mayRevenue;
  juneTotal += juneRevenue;

  console.log(
    client.padEnd(25) +
    `€${(mayRevenue / 1000).toFixed(2)}K`.padEnd(20) +
    `€${(juneRevenue / 1000).toFixed(2)}K`
  );
});

console.log('-'.repeat(65));
console.log(
  'TOTAL'.padEnd(25) +
  `€${(mayTotal / 1000).toFixed(2)}K`.padEnd(20) +
  `€${(juneTotal / 1000).toFixed(2)}K`
);

const change = ((juneTotal - mayTotal) / mayTotal * 100).toFixed(2);
const changeAbs = (juneTotal - mayTotal) / 1000;

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('SUMMARY:');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`May Total Revenue:    €${(mayTotal / 1000).toFixed(2)}K`);
console.log(`June Total Revenue:   €${(juneTotal / 1000).toFixed(2)}K`);
console.log(`Change:               ${change > 0 ? '+' : ''}${change}% (${changeAbs > 0 ? '+' : ''}€${changeAbs.toFixed(2)}K)`);
console.log('\n═══════════════════════════════════════════════════════════════\n');
