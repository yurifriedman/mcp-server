import { CalendarClient } from './calendar-client.js';
import { google } from 'googleapis';
import * as fs from 'fs/promises';

async function getAuthClient() {
  const files = await fs.readdir(process.cwd());
  const credFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));

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

async function cancelFunMeetingAndSendEmail() {
  try {
    console.log('Connecting to Google Calendar...\n');
    const calendarClient = await CalendarClient.create();

    // Find today's "go and have fun" meeting
    const events = await calendarClient.getTodayEvents();
    const funMeeting = events.find(e => e.summary && e.summary.toLowerCase().includes('go and have fun'));

    if (funMeeting) {
      console.log(`Found meeting: "${funMeeting.summary}"`);
      console.log(`Time: ${new Date(funMeeting.start.dateTime).toLocaleTimeString()}`);
      console.log('\nDeleting meeting...');

      await calendarClient.deleteEvent(funMeeting.id);
      console.log('✓ Meeting cancelled successfully!\n');
    } else {
      console.log('Meeting not found. It may have already been deleted.\n');
    }

    // Send consolation email
    console.log('Sending consolation email...\n');

    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const email = [
      'To: yuri.friedman@gmail.com',
      'Subject: Sorry - Cancelled Fun Time',
      '',
      'Hi Yuri,',
      '',
      'Sorry, I had to cancel the "go and have fun" meeting at 2:00 PM today.',
      '',
      'Unfortunately, I\'m busy today and won\'t be able to take that break.',
      '',
      'Maybe we can reschedule for another time when things are less hectic!',
      '',
      'Best regards,',
      'Yuri'
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64url');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    console.log('✓ Consolation email sent successfully!');
    console.log('Message ID:', result.data.id);
    console.log('\nAll done! Meeting cancelled and email sent.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

cancelFunMeetingAndSendEmail();
