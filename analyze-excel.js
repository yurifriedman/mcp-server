import XLSX from 'xlsx';

/**
 * Analyze Excel file and generate strategy email content
 */
export function analyzeExcelAndGenerateStrategy(excelPath) {
  const workbook = XLSX.readFile(excelPath);
  const worksheet = workbook.Sheets['Comments'];

  if (!worksheet) {
    throw new Error('Comments sheet not found in Excel file');
  }

  // Convert to JSON (skip header row)
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Separate clients into declining and growing
  const declining = data.filter(row => row.Change < 0).sort((a, b) => a.Change - b.Change);
  const growing = data.filter(row => row.Change > 0).sort((a, b) => b.Change - a.Change);
  const stable = data.filter(row => row.Change === 0);

  // Calculate totals
  const mayTotal = data.reduce((sum, row) => sum + (parseFloat(row['May-25']) || 0), 0);
  const juneTotal = data.reduce((sum, row) => sum + (parseFloat(row['Jun-25']) || 0), 0);
  const overallChange = ((juneTotal - mayTotal) / mayTotal * 100).toFixed(1);

  // Generate email content
  const now = new Date();
  const dateTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  let emailBody = `SPINOMENAL REVENUE GROWTH STRATEGY & KPIs
Generated: ${dateTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analysis of client performance data reveals critical opportunities and challenges:

Overall Performance:
• May Total Revenue: €${(mayTotal / 1000).toFixed(1)}K
• June Total Revenue: €${(juneTotal / 1000).toFixed(1)}K
• Overall Change: ${overallChange}%

📉 Major Revenue Declines:
`;

  // Add top declining clients
  declining.slice(0, 5).forEach(client => {
    const changePct = (client.Change * 100).toFixed(1);
    const changeAbs = (client['Jun-25'] - client['May-25']) / 1000;
    emailBody += `• ${client.Client}: ${changePct}% (€${changeAbs.toFixed(1)}K) - ${client.Comment}\n`;
  });

  emailBody += `\n📈 Strong Growth Performers:\n`;

  // Add top growing clients
  growing.slice(0, 5).forEach(client => {
    const changePct = (client.Change * 100).toFixed(1);
    const changeAbs = (client['Jun-25'] - client['May-25']) / 1000;
    emailBody += `• ${client.Client}: +${changePct}% (+€${changeAbs.toFixed(1)}K) - ${client.Comment}\n`;
  });

  emailBody += `

STRATEGIC PRIORITIES FOR NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. RESTORE UNDERPERFORMING ACCOUNTS (Priority: CRITICAL)

`;

  // Generate recovery plans for top 3 declining accounts
  declining.slice(0, 3).forEach((client, index) => {
    const changePct = (client.Change * 100).toFixed(1);
    const changeAbs = Math.abs((client['Jun-25'] - client['May-25']) / 1000).toFixed(1);
    const recoveryTarget = (Math.abs(client['Jun-25'] - client['May-25']) * 0.5 / 1000).toFixed(1);

    emailBody += `${client.Client} Recovery Plan:
   → Issue: ${client.Comment}
   → Conclusion: ${client.Conclusion}
   → Target: Recover 50% of lost revenue (+€${recoveryTarget}K)

`;
  });

  emailBody += `2. CAPITALIZE ON HIGH PERFORMERS (Priority: HIGH)

`;

  // Generate growth plans for top 3 growing accounts
  growing.slice(0, 3).forEach((client, index) => {
    const changePct = (client.Change * 100).toFixed(1);
    const changeAbs = ((client['Jun-25'] - client['May-25']) / 1000).toFixed(1);
    const growthTarget = (client['Jun-25'] * 0.3 / 1000).toFixed(1);

    emailBody += `${client.Client} Expansion Strategy:
   → Current Success: ${client.Comment}
   → Action Plan: ${client.Conclusion}
   → Target: +30% MoM growth (+€${growthTarget}K)

`;
  });

  // Group by Account Manager
  const byAM = {};
  data.forEach(row => {
    const am = row.AM || 'Unknown';
    if (!byAM[am]) {
      byAM[am] = { clients: [], totalMay: 0, totalJune: 0 };
    }
    byAM[am].clients.push(row);
    byAM[am].totalMay += parseFloat(row['May-25']) || 0;
    byAM[am].totalJune += parseFloat(row['Jun-25']) || 0;
  });

  emailBody += `3. ACCOUNT MANAGER FOCUS AREAS

`;

  Object.entries(byAM).forEach(([am, data]) => {
    const amChange = ((data.totalJune - data.totalMay) / data.totalMay * 100).toFixed(1);
    const clientList = data.clients.map(c => c.Client).join(', ');

    emailBody += `${am}'s Portfolio (${amChange}% change):
   → Clients: ${clientList}
   → Focus: `;

    if (parseFloat(amChange) < 0) {
      emailBody += `Priority recovery actions needed\n`;
    } else if (parseFloat(amChange) > 20) {
      emailBody += `Scale successful strategies\n`;
    } else {
      emailBody += `Maintain and optimize current approach\n`;
    }
    emailBody += '\n';
  });

  // KPIs section
  const targetGrowth = 0.12;
  const targetRevenue = (juneTotal * (1 + targetGrowth) / 1000).toFixed(1);
  const totalDecline = declining.reduce((sum, row) => sum + (row['Jun-25'] - row['May-25']), 0);
  const recoveryGoal = (Math.abs(totalDecline) * 0.4 / 1000).toFixed(1);

  emailBody += `
KEY PERFORMANCE INDICATORS (KPIs) - NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY KPIs:

1. Overall Revenue Growth
   Target: +12% MoM
   Baseline: €${(juneTotal / 1000).toFixed(1)}K (June total)
   Goal: €${targetRevenue}K

2. Recovery Rate - Declined Accounts
   Target: Recover 40% of June losses
   June decline: €${(totalDecline / 1000).toFixed(1)}K (across declining accounts)
   Recovery goal: +€${recoveryGoal}K

3. High Performer Acceleration
   Target: +35% growth on top performers
   June total (top ${growing.length} performers): €${(growing.reduce((sum, r) => sum + r['Jun-25'], 0) / 1000).toFixed(1)}K

SECONDARY KPIs:

4. Client Retention Rate
   Target: 95% (${Math.floor(data.length * 0.95)} of ${data.length} clients maintained or growing)

5. Account Manager Performance Balance
   Target: All AMs achieve positive MoM growth

WEEKLY MONITORING METRICS:

• Run rate tracking (actual vs. target pace)
• Game positioning changes and impact
• RTP performance by key title
• Promotional campaign ROI
• AM-specific portfolio performance


RISK MITIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical Risks Identified:
`;

  // Identify risks from comments
  const rtpDependency = data.filter(row =>
    row.Comment && row.Comment.toLowerCase().includes('rtp')
  );
  if (rtpDependency.length > 0) {
    emailBody += `\n1. RTP Dependency (${rtpDependency.map(r => r.Client).join(', ')})
   Mitigation: Diversify positioning, don't rely solely on game performance\n`;
  }

  const promoIssues = data.filter(row =>
    row.Comment && (row.Comment.toLowerCase().includes('promo') || row.Comment.toLowerCase().includes('position'))
  );
  if (promoIssues.length > 0) {
    emailBody += `\n2. Promotional/Positioning Challenges (${promoIssues.length} clients affected)
   Mitigation: Book promotional slots 2-3 months ahead, maintain strong AM relationships\n`;
  }

  const integrationIssues = data.filter(row =>
    row.Comment && row.Comment.toLowerCase().includes('integration')
  );
  if (integrationIssues.length > 0) {
    emailBody += `\n3. Integration Delays (${integrationIssues.map(r => r.Client).join(', ')})
   Mitigation: Prepare alternative growth levers, don't depend on single catalyst\n`;
  }

  emailBody += `

IMMEDIATE ACTIONS (Week 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  // Generate action items from declining clients and conclusions
  declining.slice(0, 5).forEach(client => {
    if (client.Conclusion && client.Conclusion.trim()) {
      emailBody += `□ ${client.Client}: ${client.Conclusion}\n`;
    }
  });

  growing.slice(0, 3).forEach(client => {
    if (client.Conclusion && client.Conclusion.trim()) {
      emailBody += `□ ${client.Client}: ${client.Conclusion}\n`;
    }
  });

  // Calculate projected impact
  const conservativeGrowth = (juneTotal * 0.08 / 1000).toFixed(1);
  const targetGrowthAmount = (juneTotal * 0.12 / 1000).toFixed(1);
  const optimisticGrowth = (juneTotal * 0.18 / 1000).toFixed(1);

  emailBody += `

PROJECTED REVENUE IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conservative Scenario: +8% MoM (+€${conservativeGrowth}K)
Target Scenario: +12% MoM (+€${targetGrowthAmount}K)
Optimistic Scenario: +18% MoM (+€${optimisticGrowth}K)

Success depends on:
✓ Execution of recovery plans for top decliners
✓ Maintaining momentum in high-growth accounts
✓ Securing promotional slots in advance
✓ Timely resolution of technical/integration issues


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This strategy prioritizes quick wins (promotional restorations), scales proven successes, and addresses structural issues (integrations, positioning) for sustainable growth.

Weekly review recommended to track KPI progress and adjust tactics.

Data Source: AgentInput.xlsx
Analysis Date: ${dateTime}`;

  return emailBody;
}
