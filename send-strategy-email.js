import { GmailClient } from './dist/gmail.js';

async function sendStrategyEmail() {
  try {
    console.log('Connecting to Gmail...');
    const client = await GmailClient.create();

    const now = new Date();
    const dateTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const emailBody = `SPINOMENAL REVENUE GROWTH STRATEGY & KPIs
Generated: ${dateTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analysis of client performance data reveals critical opportunities and challenges:

📉 Major Revenue Declines:
• Soft2bet: -21.9% (-€55.4K) - V3 migration impact
• Lemon: -41.7% (-€18.4K) - Reduced promotional activity
• Draftkings: -43.3% (-€5.5K) - Low exposure on exclusives
• Digitain: -31.1% (-€6.1K) - Loss of key promotional placements

📈 Strong Growth Performers:
• Hub88: +71.0% (+€3.1K) - VIP attraction & brand expansion
• GML: +70.2% (+€2.4K) - Improved RTP performance
• Parimatch: +38.7% (+€6.4K) - Brand expansion & positioning
• Lucky Dreams: +31.8% (+€5.1K) - Heavy game promotion


STRATEGIC PRIORITIES FOR NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. RESTORE UNDERPERFORMING ACCOUNTS (Priority: CRITICAL)

Soft2bet Recovery Plan:
   → Re-launch Free Spins campaigns (in progress)
   → Restore legacy game positions
   → Target: Recover 50% of lost revenue (+€27K)

Lemon/Bison Promotional Push:
   → Negotiate advance promotional slots for next 2 months
   → Push for pre-release game placements
   → Target: +15% MoM growth (+€3.8K)

Draftkings Exposure Enhancement:
   → Review and renegotiate category placement commitments
   → Ensure contractual promotional spots are fulfilled
   → Target: Return to baseline (+€5.5K recovery)

2. CAPITALIZE ON HIGH PERFORMERS (Priority: HIGH)

Hub88 Streamer Activation:
   → Scale streamer partnerships initiated this month
   → Leverage VIP player attraction from Blazing Rhino H&H
   → Integrate more Tech4s brands (Tortuga opportunity)
   → Target: +40% MoM growth (+€3K)

Parimatch Brand Expansion:
   → Finalize contract separation of Ukrainian brand IDs
   → Launch Gorilla branded game with premium positioning
   → Target: +25% MoM growth (+€5.8K)

Lucky Dreams Category Optimization:
   → Maximize Spinomenal Category week performance
   → Maintain improved positioning gains
   → Target: Sustain +30% growth trajectory (+€6.3K)

3. INTEGRATION & TECHNICAL IMPROVEMENTS (Priority: MEDIUM)

Direct Integrations:
   → Mozzzartbet: Schedule call to discuss direct integration
     (eliminates FS limitation under Omega platform)
   → sg-mostbet: Push for September direct integration
   → Expected impact: +€5-8K combined monthly uplift

Platform Enhancements:
   → GML: Launch Reel Noice - improve positioning leverage
   → Holand Casino: Maximize Platinum package & leaderboard FS
   → Target: +€2-3K combined

4. PROMOTIONAL STRATEGY OPTIMIZATION (Priority: HIGH)

Game Portfolio Focus:
   HIGH PERFORMERS to promote:
   • Blazing Rhino H&H (proven VIP attraction)
   • Book of Titans - Zeus (pre-release success)
   • Wolf & Piggies Chase (needs better positioning)
   • Zeus Unchained H&H
   • Majestic Wild Buffalo DTD

   Position Restoration (Tech4s model):
   → Replicate May promotional blocks that drove performance
   → Monitor run rate weekly and adjust positioning dynamically

Advanced Promotional Booking:
   → Secure promotional slots 2-3 months in advance
   → Reduce dependency on last-minute availability
   → Priority partners: Lemon, Bison, Digitain

5. ACCOUNT MANAGEMENT FOCUS AREAS

Nir's Portfolio (Mixed Performance):
   → Eduardo: Address tournament overlap issue to prevent further decline
   → sg-mostbet: Maintain positions, await September integration
   → alea-casinoenvivo: Monitor 30% discount impact vs positioning

Tom's Portfolio (Growth Opportunity):
   → N1: Execute London meeting follow-up
   → Push exclusive game promotion
   → Target: +50% growth (+€2.6K)

Emily's Portfolio (Requires Attention):
   → Digitain: Restore Grandpashabet fixed deduction/promo
   → Softgenious: Resolve BO deduction display issue
   → Draftkings: Enforce promotional commitments


KEY PERFORMANCE INDICATORS (KPIs) - NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY KPIs:

1. Overall Revenue Growth
   Target: +12% MoM
   Baseline: €247K (June total)
   Goal: €277K

2. Recovery Rate - Declined Accounts
   Target: Recover 40% of June losses
   June decline: -€85K (across declining accounts)
   Recovery goal: +€34K

3. High Performer Acceleration
   Target: +35% growth on top 4 performers
   June total (Hub88, GML, Parimatch, Lucky Dreams): €53K
   Goal: €72K

SECONDARY KPIs:

4. New Game Launch Performance
   Target: 3 successful game launches
   Success metric: €2K+ revenue per game in first month

5. Promotional Slot Fulfillment Rate
   Target: 95% of booked promotions executed
   Track: Actual vs. committed promotional placements

6. Direct Integration Progress
   Target: 2 integrations moved to direct/advanced stage
   Focus: Mozzzartbet, sg-mostbet

7. VIP Player Acquisition
   Target: 5 new high-value players across portfolio
   Track: Players with €1K+ monthly losses on our games

8. Discount Optimization Rate
   Target: Maintain average discount at 30-35%
   Monitor: Revenue impact vs. positioning quality

WEEKLY MONITORING METRICS:

• Run rate tracking (actual vs. target pace)
• Game positioning changes and impact
• RTP performance by key title
• Promotional campaign ROI
• AM-specific portfolio performance


RISK MITIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical Risks:

1. RTP Dependency (sg-mostbet, GML)
   Mitigation: Diversify positioning, don't rely solely on game performance

2. Promotional Slot Availability
   Mitigation: Book 2-3 months ahead, maintain strong AM relationships

3. Integration Delays (sg-mostbet September)
   Mitigation: Prepare alternative growth levers, don't depend on single catalyst

4. Tournament/Promo Execution Errors (Eduardo)
   Mitigation: Implement checklist system for multi-promo campaigns


IMMEDIATE ACTIONS (Week 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Soft2bet: Confirm FS campaign relaunch timeline
□ Lemon: Book August-September promotional slots
□ Draftkings: Escalation call re: promotional commitments
□ Mozzzartbet: Schedule direct integration discussion call
□ Hub88: Scale streamer partnerships
□ Parimatch: Finalize contract for brand ID separation
□ N1: Follow up on London meeting action items
□ Tech4s: Restore May promotional block configuration


PROJECTED REVENUE IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conservative Scenario: +8% MoM (+€20K)
Target Scenario: +12% MoM (+€30K)
Optimistic Scenario: +18% MoM (+€44K)

Success depends on:
✓ Execution of recovery plans for top decliners
✓ Maintaining momentum in high-growth accounts
✓ Securing promotional slots in advance
✓ Timely resolution of technical/integration issues


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This strategy prioritizes quick wins (promotional restorations), scales proven successes (Hub88, Parimatch), and addresses structural issues (integrations, positioning) for sustainable growth.

Weekly review recommended to track KPI progress and adjust tactics.`;

    console.log('Sending strategy email...');
    const result = await client.sendMessage({
      to: ['yuri.friedman@gmail.com'],
      subject: `Spinomenal strategy - ${dateTime}`,
      body: emailBody,
      contentType: 'text/plain'
    });

    console.log('\n✓ Strategy email sent successfully!');
    console.log('Message ID:', result.id);
    console.log('Thread ID:', result.threadId);
    console.log('\nCheck your inbox at yuri.friedman@gmail.com');

  } catch (error) {
    console.error('Error sending email:', error.message);
  }
}

sendStrategyEmail();
