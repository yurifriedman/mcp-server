import { CalendarClient } from './calendar-client.js';

const DEFAULT_ZOOM_LINK = 'https://us06web.zoom.us/j/9869620426?pwd=QXlyQ0EwOW1YRjdnK0pTNmhpeHFKZz09';

async function createLoraCoffeeMeeting() {
  try {
    console.log('Connecting to Google Calendar...\n');
    const client = await CalendarClient.create();

    // Create meeting for today at 2:00 PM
    const today = new Date();
    today.setHours(14, 0, 0, 0); // 2:00 PM

    const endTime = new Date(today);
    endTime.setHours(15, 0, 0, 0); // 3:00 PM (1 hour duration)

    const eventData = {
      summary: 'Coffee & Life Strategy Chat with Lora',
      description: `Let's drink coffee and talk about life strategy - it's going to be fun!

Join Zoom Meeting:
${DEFAULT_ZOOM_LINK}`,
      start: today.toISOString(),
      end: endTime.toISOString(),
      attendees: ['lora.iomdin@gmail.com'],
      location: DEFAULT_ZOOM_LINK
    };

    console.log('Creating meeting...');
    console.log(`Title: ${eventData.summary}`);
    console.log(`Start: ${today.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`);
    console.log(`End: ${endTime.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`);
    console.log(`Location: ${DEFAULT_ZOOM_LINK}`);
    console.log(`Attendees: ${eventData.attendees.join(', ')}`);
    console.log('');

    const event = await client.createEvent(eventData);

    console.log('✓ Meeting created successfully!\n');
    console.log('Event ID:', event.id);
    console.log('Event Link:', event.htmlLink);
    console.log('\n☕ Calendar invitation sent to Lora Iomdin!');
    console.log('Have a great coffee chat! 🎉');

  } catch (error) {
    console.error('Error creating meeting:', error.message);
  }
}

createLoraCoffeeMeeting();
