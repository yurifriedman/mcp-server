import { GmailClient } from './dist/gmail.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function sendEmail() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Connecting to Gmail...`);
    const client = await GmailClient.create();

    // Read the email body from mail-example.md
    const emailBody = await fs.readFile(path.join(process.cwd(), 'mail-example.md'), 'utf-8');

    console.log(`[${new Date().toLocaleTimeString()}] Sending email...`);
    const result = await client.sendMessage({
      to: ['yuri.friedman@gmail.com'],
      subject: 'i\'m a superhero',
      body: emailBody,
      contentType: 'text/plain'
    });

    console.log(`[${new Date().toLocaleTimeString()}] ✓ Email sent successfully!`);
    console.log(`  Message ID: ${result.id}`);
    console.log(`  Thread ID: ${result.threadId}\n`);

  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending email:`, error.message);
  }
}

// Send email immediately on startup
console.log('Starting automated email sender...');
console.log('Emails will be sent every minute.');
console.log('Press Ctrl+C to stop.\n');

sendEmail();

// Then send every minute (60000 milliseconds)
setInterval(sendEmail, 60000);
