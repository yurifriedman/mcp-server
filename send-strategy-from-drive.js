import { GmailClient } from './dist/gmail.js';
import { DriveClient } from './dist/drive.js';
import { analyzeExcelAndGenerateStrategy } from './analyze-excel.js';
import * as path from 'path';
import * as fs from 'fs';

const EXCEL_FILENAME = 'AgentInput.xlsx';
const LOCAL_EXCEL_PATH = path.join(process.cwd(), 'temp_' + EXCEL_FILENAME);

async function sendStrategyEmail() {
  try {
    const now = new Date();
    console.log(`[${now.toLocaleTimeString()}] Starting strategy email process...`);

    // Step 1: Download Excel from Google Drive
    console.log(`[${now.toLocaleTimeString()}] Connecting to Google Drive...`);
    const driveClient = await DriveClient.create();

    console.log(`[${now.toLocaleTimeString()}] Downloading ${EXCEL_FILENAME} from Google Drive...`);
    await driveClient.downloadFileByName(EXCEL_FILENAME, LOCAL_EXCEL_PATH);

    // Step 2: Analyze Excel and generate email content
    console.log(`[${now.toLocaleTimeString()}] Analyzing Excel data...`);
    const emailBody = analyzeExcelAndGenerateStrategy(LOCAL_EXCEL_PATH);

    // Step 3: Connect to Gmail and send email
    console.log(`[${now.toLocaleTimeString()}] Connecting to Gmail...`);
    const gmailClient = await GmailClient.create();

    const dateTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    console.log(`[${now.toLocaleTimeString()}] Sending strategy email...`);
    const result = await gmailClient.sendMessage({
      to: ['yuri.friedman@gmail.com'],
      subject: `Spinomenal Strategy Analysis - ${dateTime}`,
      body: emailBody,
      contentType: 'text/plain'
    });

    console.log(`[${now.toLocaleTimeString()}] ✓ Email sent successfully!`);
    console.log(`  Message ID: ${result.id}`);
    console.log(`  Thread ID: ${result.threadId}\n`);

  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error:`, error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Send email immediately on startup
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  SPINOMENAL STRATEGY EMAIL AUTOMATION                          ║');
console.log('║  Strategy emails will be sent every 3 hours                    ║');
console.log('║  Excel data fetched from Google Drive before each send         ║');
console.log('║  Press Ctrl+C to stop                                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

sendStrategyEmail();

// Then send every 3 hours (10800000 milliseconds = 3 hours)
setInterval(sendStrategyEmail, 10800000);
