import { CalendarClient } from './calendar-client.js';

async function getWeekCalendar() {
  try {
    console.log('Connecting to Google Calendar...\n');
    const client = await CalendarClient.create();

    console.log('Fetching this week\'s events...\n');
    const events = await client.getWeekEvents();

    console.log('═'.repeat(100));
    console.log(`📅 YOUR CALENDAR FOR THE NEXT 7 DAYS`);
    console.log('═'.repeat(100));

    if (events.length === 0) {
      console.log('\n✨ No events scheduled for the next 7 days!\n');
      return;
    }

    console.log(`\nYou have ${events.length} event(s) this week:\n`);

    // Group events by day
    const eventsByDay = {};
    events.forEach(event => {
      const start = event.start.dateTime || event.start.date;
      const day = new Date(start).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      if (!eventsByDay[day]) {
        eventsByDay[day] = [];
      }
      eventsByDay[day].push(event);
    });

    // Display events grouped by day
    Object.keys(eventsByDay).forEach(day => {
      console.log(`\n${'─'.repeat(100)}`);
      console.log(`📆 ${day}`);
      console.log(`${'─'.repeat(100)}\n`);

      eventsByDay[day].forEach((event, index) => {
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

        console.log(`  🕒 ${startTime} - ${endTime}`);
        console.log(`  📋 ${event.summary || '(No title)'}`);

        if (event.location) {
          console.log(`  📍 ${event.location}`);
        }

        if (event.attendees && event.attendees.length > 0) {
          const attendeeCount = event.attendees.length;
          console.log(`  👥 ${attendeeCount} attendee(s)`);
        }

        console.log('');
      });
    });

    console.log('═'.repeat(100));
    console.log(`\n📊 Total: ${events.length} events this week\n`);

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

getWeekCalendar();
