import { GmailClient } from './dist/gmail.js';

async function sendTestEmail() {
  try {
    console.log('Connecting to Gmail...');
    const client = await GmailClient.create();

    console.log('Sending test email...');
    const result = await client.sendMessage({
      to: ['yuri.friedman@gmail.com'],
      subject: 'i\'m a superhero',
      body: 'Hello - yuri  test the gmail',
      contentType: 'text/plain'
    });

    console.log('\n✓ Email sent successfully!');
    console.log('Message ID:', result.id);
    console.log('Thread ID:', result.threadId);
    console.log('\nCheck your inbox at yuri.friedman@gmail.com');

  } catch (error) {
    console.error('Error sending email:', error.message);
  }
}

sendTestEmail();
