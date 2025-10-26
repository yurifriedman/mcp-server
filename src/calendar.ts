/**
 * Google Calendar Client
 * Provides calendar operations using OAuth2 authentication
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';

/**
 * Get authenticated OAuth2 client
 */
async function getAuthClient(): Promise<OAuth2Client> {
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

/**
 * Calendar Client class
 */
export class CalendarClient {
  private calendar: calendar_v3.Calendar;

  constructor(auth: OAuth2Client) {
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Factory method to create authenticated client
   */
  static async create(): Promise<CalendarClient> {
    const auth = await getAuthClient();
    return new CalendarClient(auth);
  }

  /**
   * List upcoming events
   */
  async listEvents(options: {
    maxResults?: number;
    timeMin?: string;
    timeMax?: string;
    q?: string;
  } = {}): Promise<calendar_v3.Schema$Event[]> {
    const {
      maxResults = 10,
      timeMin = new Date().toISOString(),
      timeMax,
      q
    } = options;

    const params: calendar_v3.Params$Resource$Events$List = {
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
   */
  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    return response.data;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    attendees?: string[];
    location?: string;
    timeZone?: string;
  }): Promise<calendar_v3.Schema$Event> {
    const event: calendar_v3.Schema$Event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'Asia/Jerusalem',
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'Asia/Jerusalem',
      },
    };

    if (eventData.attendees && eventData.attendees.length > 0) {
      event.attendees = eventData.attendees.map(email => ({ email }));
    }

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all',
    });

    return response.data;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: string;
    end?: string;
    attendees?: string[];
    timeZone?: string;
  }): Promise<calendar_v3.Schema$Event> {
    const event = await this.getEvent(eventId);

    if (updates.summary) event.summary = updates.summary;
    if (updates.description) event.description = updates.description;
    if (updates.location) event.location = updates.location;
    if (updates.start) {
      event.start = {
        dateTime: updates.start,
        timeZone: updates.timeZone || 'Asia/Jerusalem',
      };
    }
    if (updates.end) {
      event.end = {
        dateTime: updates.end,
        timeZone: updates.timeZone || 'Asia/Jerusalem',
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
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });
  }

  /**
   * Find free time slots
   */
  async findFreeSlots(options: {
    timeMin: string;
    timeMax: string;
    duration?: number;
  }): Promise<{ start: string; end: string }[]> {
    const { timeMin, timeMax, duration = 60 } = options;

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    const freeSlots: { start: string; end: string }[] = [];

    let currentTime = new Date(timeMin);
    const endTime = new Date(timeMax);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      const isBusy = busySlots.some(busy => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
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
   */
  async getTodayEvents(): Promise<calendar_v3.Schema$Event[]> {
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
   */
  async getWeekEvents(): Promise<calendar_v3.Schema$Event[]> {
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
