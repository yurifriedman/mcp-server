import { GmailClient } from './dist/gmail.js';

async function testGmail() {
  try {
    console.log('Connecting to Gmail...');
    const client = await GmailClient.create();

    console.log('Searching for first message in inbox...');
    const result = await client.searchMessages({
      query: 'in:inbox',
      maxResults: 1
    });

    if (result.messages.length === 0) {
      console.log('No messages found in inbox.');
      return;
    }

    console.log('\n=== FIRST MESSAGE IN INBOX ===\n');
    const firstMessage = result.messages[0];
    console.log('From:', firstMessage.from);
    console.log('Subject:', firstMessage.subject);
    console.log('Date:', firstMessage.date);
    console.log('Snippet:', firstMessage.snippet);
    console.log('\nMessage ID:', firstMessage.id);

    // Get full message
    console.log('\n=== GETTING FULL MESSAGE ===\n');
    const fullMessage = await client.getMessage({ messageId: firstMessage.id });
    console.log('To:', fullMessage.to.join(', '));
    console.log('\n--- Body (Plain Text) ---');
    console.log(fullMessage.body.plain || 'No plain text body');

    if (fullMessage.attachments.length > 0) {
      console.log('\n--- Attachments ---');
      fullMessage.attachments.forEach(att => {
        console.log(`- ${att.filename} (${att.mimeType}, ${att.size} bytes)`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGmail();
