import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';

async function getAuthClient() {
  const files = await fs.readdir(process.cwd());
  const credFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));

  if (!credFile) {
    throw new Error('No client_secret_*.json file found.');
  }

  const content = await fs.readFile(credFile, 'utf-8');
  const credentials = JSON.parse(content);
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = await fs.readFile('token.json', 'utf-8');
  oauth2Client.setCredentials(JSON.parse(token));

  return oauth2Client;
}

async function searchEmails() {
  try {
    console.log('Connecting to Gmail...');
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    console.log('Searching for emails from avi.bachar@agileprimero.com...\n');

    // Search for emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:avi.bachar@agileprimero.com',
      maxResults: 10
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('No emails found from avi.bachar@agileprimero.com.');
      return;
    }

    console.log(`Found ${response.data.messages.length} emails from Avi Bachar:\n`);
    console.log('='.repeat(100));

    // Get details for each message
    for (let i = 0; i < response.data.messages.length; i++) {
      const message = response.data.messages[i];
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const headers = msg.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';

      // Get email body
      let body = '';

      function extractTextFromPart(part) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          for (const subPart of part.parts) {
            const text = extractTextFromPart(subPart);
            if (text) return text;
          }
        }
        return '';
      }

      if (msg.data.payload.parts) {
        body = extractTextFromPart(msg.data.payload);
      } else if (msg.data.payload.body.data) {
        body = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
      }

      console.log(`\n📧 EMAIL ${i + 1} of ${response.data.messages.length}`);
      console.log('-'.repeat(100));
      console.log(`Date: ${date}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`\nFull Email Body:`);
      console.log('-'.repeat(100));
      console.log(body || '(No text content found)');
      console.log('='.repeat(100));
    }

    // Create summary
    console.log(`\n\n📊 SUMMARY OF EMAILS FROM AVI BACHAR`);
    console.log('='.repeat(100));
    console.log(`Total emails found: ${response.data.messages.length}`);
    console.log(`Email address: avi.bachar@agileprimero.com`);
    console.log('='.repeat(100));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

searchEmails();
