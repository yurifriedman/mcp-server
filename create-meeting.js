import { CalendarClient } from './calendar-client.js';

/**
 * Default Zoom link for all meetings
 */
const DEFAULT_ZOOM_LINK = 'https://us06web.zoom.us/j/9869620426?pwd=QXlyQ0EwOW1YRjdnK0pTNmhpeHFKZz09';

/**
 * Create a calendar meeting with default Zoom link
 * @param {Object} meetingData
 * @param {string} meetingData.title - Meeting title
 * @param {string} meetingData.start - Start time (ISO format or readable format)
 * @param {string} meetingData.end - End time (ISO format or readable format)
 * @param {Array<string>} meetingData.attendees - List of attendee emails
 * @param {string} meetingData.description - Meeting description (optional)
 * @param {string} meetingData.location - Custom location (optional, defaults to Yuri's Zoom)
 */
async function createMeeting(meetingData) {
  try {
    console.log('Connecting to Google Calendar...\n');
    const client = await CalendarClient.create();

    // Parse dates if they're not in ISO format
    const startDate = new Date(meetingData.start);
    const endDate = new Date(meetingData.end);

    // Use default Zoom link unless custom location specified
    const location = meetingData.location || DEFAULT_ZOOM_LINK;

    // Add Zoom link to description if not already there
    let description = meetingData.description || '';
    if (!description.includes(DEFAULT_ZOOM_LINK)) {
      description += `\n\nJoin Zoom Meeting:\n${DEFAULT_ZOOM_LINK}`;
    }

    const eventData = {
      summary: meetingData.title,
      description: description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      attendees: meetingData.attendees || [],
      location: location
    };

    console.log('Creating meeting...');
    console.log(`Title: ${eventData.summary}`);
    console.log(`Start: ${startDate.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`);
    console.log(`End: ${endDate.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`);
    console.log(`Location: ${location}`);
    if (eventData.attendees.length > 0) {
      console.log(`Attendees: ${eventData.attendees.join(', ')}`);
    }
    console.log('');

    const event = await client.createEvent(eventData);

    console.log('✓ Meeting created successfully!\n');
    console.log('Event ID:', event.id);
    console.log('Event Link:', event.htmlLink);
    console.log('\nInvitations have been sent to all attendees.');

    return event;

  } catch (error) {
    console.error('Error creating meeting:', error.message);
    throw error;
  }
}

// Example usage if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Example: Create a meeting tomorrow at 2 PM for 1 hour
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const endTime = new Date(tomorrow);
  endTime.setHours(15, 0, 0, 0);

  createMeeting({
    title: 'Test Meeting',
    start: tomorrow.toISOString(),
    end: endTime.toISOString(),
    attendees: ['yuri.friedman@gmail.com'],
    description: 'This is a test meeting created by the calendar agent.'
  }).catch(console.error);
}

export { createMeeting, DEFAULT_ZOOM_LINK };
