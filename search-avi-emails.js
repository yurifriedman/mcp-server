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

    console.log('Searching for emails from Avi Bahar...\n');

    // Search for emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:avi bahar',
      maxResults: 10
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('No emails found from Avi Bahar.');
      return;
    }

    console.log(`Found ${response.data.messages.length} emails from Avi Bahar:\n`);
    console.log('='.repeat(80));

    // Get details for each message
    for (const message of response.data.messages) {
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
      if (msg.data.payload.parts) {
        const textPart = msg.data.payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (msg.data.payload.body.data) {
        body = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
      }

      console.log(`\nDate: ${date}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`\nBody Preview (first 500 chars):`);
      console.log('-'.repeat(80));
      console.log(body.substring(0, 500));
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

searchEmails();
