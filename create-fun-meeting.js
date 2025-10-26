import { CalendarClient } from './calendar-client.js';

const DEFAULT_ZOOM_LINK = 'https://us06web.zoom.us/j/9869620426?pwd=QXlyQ0EwOW1YRjdnK0pTNmhpeHFKZz09';

async function createFunMeeting() {
  try {
    console.log('Connecting to Google Calendar...\n');
    const client = await CalendarClient.create();

    // Create meeting for today at 2:00 PM
    const today = new Date();
    today.setHours(14, 0, 0, 0); // 2:00 PM

    const endTime = new Date(today);
    endTime.setHours(15, 0, 0, 0); // 3:00 PM (1 hour duration)

    const eventData = {
      summary: 'go and have fun',
      description: `Time to relax and have fun!\n\nJoin Zoom Meeting:\n${DEFAULT_ZOOM_LINK}`,
      start: today.toISOString(),
      end: endTime.toISOString(),
      attendees: [], // Just you, no other attendees
      location: DEFAULT_ZOOM_LINK
    };

    console.log('Creating meeting...');
    console.log(`Title: ${eventData.summary}`);
    console.log(`Start: ${today.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`);
    console.log(`End: ${endTime.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`);
    console.log(`Location: ${DEFAULT_ZOOM_LINK}`);
    console.log('');

    const event = await client.createEvent(eventData);

    console.log('✓ Meeting created successfully!\n');
    console.log('Event ID:', event.id);
    console.log('Event Link:', event.htmlLink);
    console.log('\n🎉 Enjoy your fun time!');

  } catch (error) {
    console.error('Error creating meeting:', error.message);
  }
}

createFunMeeting();
