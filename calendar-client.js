import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';

/**
 * Google Calendar Client
 * Provides calendar operations using OAuth2 authentication
 */

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

export class CalendarClient {
  constructor(auth) {
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  static async create() {
    const auth = await getAuthClient();
    return new CalendarClient(auth);
  }

  /**
   * List upcoming events
   * @param {Object} options
   * @param {number} options.maxResults - Maximum number of events to return (default: 10)
   * @param {string} options.timeMin - Start time (ISO format)
   * @param {string} options.timeMax - End time (ISO format)
   * @param {string} options.q - Search query
   * @returns {Promise<Array>} List of events
   */
  async listEvents(options = {}) {
    const {
      maxResults = 10,
      timeMin = new Date().toISOString(),
      timeMax,
      q
    } = options;

    const params = {
      calendarId: 'primary',
      timeMin,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (timeMax) params.timeMax = timeMax;
    if (q) params.q = q;

    const response = await this.calendar.events.list(params);
    return response.data.items || [];
  }

  /**
   * Get a specific event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event details
   */
  async getEvent(eventId) {
    const response = await this.calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    return response.data;
  }

  /**
   * Create a new calendar event
   * @param {Object} eventData
   * @param {string} eventData.summary - Event title
   * @param {string} eventData.description - Event description
   * @param {string} eventData.start - Start time (ISO format)
   * @param {string} eventData.end - End time (ISO format)
   * @param {Array<string>} eventData.attendees - List of attendee emails
   * @param {string} eventData.location - Event location
   * @returns {Promise<Object>} Created event
   */
  async createEvent(eventData) {
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start,
        timeZone: 'Asia/Jerusalem',
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'Asia/Jerusalem',
      },
    };

    if (eventData.attendees && eventData.attendees.length > 0) {
      event.attendees = eventData.attendees.map(email => ({ email }));
    }

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    return response.data;
  }

  /**
   * Update an existing event
   * @param {string} eventId - Event ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(eventId, updates) {
    const event = await this.getEvent(eventId);

    if (updates.summary) event.summary = updates.summary;
    if (updates.description) event.description = updates.description;
    if (updates.location) event.location = updates.location;
    if (updates.start) {
      event.start = {
        dateTime: updates.start,
        timeZone: 'Asia/Jerusalem',
      };
    }
    if (updates.end) {
      event.end = {
        dateTime: updates.end,
        timeZone: 'Asia/Jerusalem',
      };
    }
    if (updates.attendees) {
      event.attendees = updates.attendees.map(email => ({ email }));
    }

    const response = await this.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
      sendUpdates: 'all',
    });

    return response.data;
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId) {
    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });
  }

  /**
   * Find free time slots
   * @param {Object} options
   * @param {string} options.timeMin - Start time
   * @param {string} options.timeMax - End time
   * @param {number} options.duration - Duration in minutes (default: 60)
   * @returns {Promise<Array>} Available time slots
   */
  async findFreeSlots(options) {
    const { timeMin, timeMax, duration = 60 } = options;

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      },
    });

    const busySlots = response.data.calendars.primary.busy || [];
    const freeSlots = [];

    let currentTime = new Date(timeMin);
    const endTime = new Date(timeMax);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      const isBusy = busySlots.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return currentTime < busyEnd && slotEnd > busyStart;
      });

      if (!isBusy && slotEnd <= endTime) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute increments
    }

    return freeSlots;
  }

  /**
   * Get today's events
   * @returns {Promise<Array>} Today's events
   */
  async getTodayEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.listEvents({
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      maxResults: 50,
    });
  }

  /**
   * Get this week's events
   * @returns {Promise<Array>} This week's events
   */
  async getWeekEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return this.listEvents({
      timeMin: today.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults: 100,
    });
  }
}
