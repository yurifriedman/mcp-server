import { CalendarClient } from './calendar-client.js';

async function getTodaysCalendar() {
  try {
    console.log('Connecting to Google Calendar...\n');
    const client = await CalendarClient.create();

    console.log('Fetching today\'s events...\n');
    const events = await client.getTodayEvents();

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('═'.repeat(100));
    console.log(`📅 YOUR CALENDAR FOR ${today.toUpperCase()}`);
    console.log('═'.repeat(100));

    if (events.length === 0) {
      console.log('\n✨ No events scheduled for today! Enjoy your free time.\n');
      return;
    }

    console.log(`\nYou have ${events.length} event(s) today:\n`);

    events.forEach((event, index) => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;

      const startTime = new Date(start).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const endTime = new Date(end).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      console.log(`${index + 1}. 🕒 ${startTime} - ${endTime}`);
      console.log(`   📋 ${event.summary || '(No title)'}`);

      if (event.location) {
        console.log(`   📍 ${event.location}`);
      }

      if (event.attendees && event.attendees.length > 0) {
        const attendeeList = event.attendees
          .map(a => a.email)
          .slice(0, 3)
          .join(', ');
        const moreCount = event.attendees.length > 3 ? ` (+${event.attendees.length - 3} more)` : '';
        console.log(`   👥 ${attendeeList}${moreCount}`);
      }

      if (event.description) {
        const shortDesc = event.description.substring(0, 100);
        console.log(`   📝 ${shortDesc}${event.description.length > 100 ? '...' : ''}`);
      }

      console.log('');
    });

    console.log('═'.repeat(100));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('insufficient authentication scopes')) {
      console.error('\n❌ You need to enable Calendar API and update OAuth scopes!');
      console.error('Follow these steps:');
      console.error('1. Go to https://console.cloud.google.com/apis/library');
      console.error('2. Search for "Google Calendar API" and enable it');
      console.error('3. Delete token.json and run authenticate.js again');
    }
  }
}

getTodaysCalendar();
