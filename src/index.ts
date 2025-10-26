#!/usr/bin/env node

/**
 * Gmail MCP Server
 * Provides Gmail and Calendar integration through the Model Context Protocol
 * Supports both stdio (local) and HTTP/SSE (cloud) transports
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { GmailClient } from './gmail.js';
import { CalendarClient } from './calendar.js';
import {
  SearchMessagesInput,
  GetMessageInput,
  SendMessageInput,
  ModifyMessageInput,
  DeleteMessageInput,
  CreateDraftInput,
  CreateLabelInput,
  GetAttachmentInput,
  ListEventsInput,
  GetEventInput,
  CreateEventInput,
  UpdateEventInput,
  DeleteEventInput,
  FindFreeSlotsInput,
} from './types.js';

// Environment configuration
const PORT = parseInt(process.env.PORT || '8080', 10);
const IS_CLOUD_MODE = process.env.GCP_PROJECT_ID !== undefined;

// Define all available tools
const TOOLS: Tool[] = [
  {
    name: 'gmail_search_messages',
    description: 'Search for Gmail messages using Gmail query syntax. Supports filters like "from:", "to:", "subject:", "is:unread", etc.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Gmail search query (e.g., "from:example@gmail.com is:unread")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (1-500, default: 50)',
          minimum: 1,
          maximum: 500,
        },
        labelIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by label IDs',
        },
        includeSpamTrash: {
          type: 'boolean',
          description: 'Include spam and trash (default: false)',
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
      },
    },
  },
  {
    name: 'gmail_get_message',
    description: 'Retrieve a specific Gmail message by ID with full details including body and attachments.',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'Gmail message ID',
        },
        format: {
          type: 'string',
          enum: ['full', 'metadata', 'minimal', 'raw'],
          description: 'Message format (default: full)',
        },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_send_message',
    description: 'Compose and send a new email message. Supports attachments and threading.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recipient email addresses',
        },
        cc: {
          type: 'array',
          items: { type: 'string' },
          description: 'CC recipients',
        },
        bcc: {
          type: 'array',
          items: { type: 'string' },
          description: 'BCC recipients',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body content',
        },
        contentType: {
          type: 'string',
          enum: ['text/plain', 'text/html'],
          description: 'Content type (default: text/plain)',
        },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              mimeType: { type: 'string' },
              content: { type: 'string', description: 'Base64 encoded content' },
            },
            required: ['filename', 'mimeType', 'content'],
          },
          description: 'File attachments',
        },
        threadId: {
          type: 'string',
          description: 'Thread ID to reply to',
        },
        inReplyTo: {
          type: 'string',
          description: 'Message ID this is in reply to',
        },
        references: {
          type: 'string',
          description: 'References header for threading',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_modify_message',
    description: 'Modify message labels to archive, mark as read/unread, star, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'Message ID',
        },
        addLabelIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Label IDs to add (e.g., ["STARRED"], ["UNREAD"])',
        },
        removeLabelIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Label IDs to remove (e.g., ["UNREAD"], ["INBOX"])',
        },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_delete_message',
    description: 'Move message to trash or permanently delete it.',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'Message ID',
        },
        permanent: {
          type: 'boolean',
          description: 'Permanently delete (default: false, moves to trash)',
        },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_create_draft',
    description: 'Create a draft email message that can be sent later.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recipient email addresses',
        },
        cc: {
          type: 'array',
          items: { type: 'string' },
        },
        bcc: {
          type: 'array',
          items: { type: 'string' },
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body',
        },
        contentType: {
          type: 'string',
          enum: ['text/plain', 'text/html'],
        },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              mimeType: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['filename', 'mimeType', 'content'],
          },
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_list_labels',
    description: 'List all available Gmail labels (folders).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gmail_create_label',
    description: 'Create a new Gmail label (folder).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Label name',
        },
        labelListVisibility: {
          type: 'string',
          enum: ['labelShow', 'labelHide', 'labelShowIfUnread'],
          description: 'Label visibility in label list',
        },
        messageListVisibility: {
          type: 'string',
          enum: ['show', 'hide'],
          description: 'Message visibility in message list',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'gmail_get_attachment',
    description: 'Download an email attachment by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'Message ID',
        },
        attachmentId: {
          type: 'string',
          description: 'Attachment ID (from message object)',
        },
      },
      required: ['messageId', 'attachmentId'],
    },
  },
  // Calendar tools
  {
    name: 'calendar_list_events',
    description: 'List calendar events with optional filters. Default returns next 10 upcoming events.',
    inputSchema: {
      type: 'object',
      properties: {
        maxResults: {
          type: 'number',
          description: 'Maximum number of events to return (default: 10)',
          minimum: 1,
          maximum: 100,
        },
        timeMin: {
          type: 'string',
          description: 'Start time (ISO 8601 format, default: now)',
        },
        timeMax: {
          type: 'string',
          description: 'End time (ISO 8601 format)',
        },
        q: {
          type: 'string',
          description: 'Search query to filter events',
        },
      },
    },
  },
  {
    name: 'calendar_get_event',
    description: 'Get details of a specific calendar event by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Calendar event ID',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new calendar event with optional attendees and location.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Event title/summary',
        },
        description: {
          type: 'string',
          description: 'Event description',
        },
        start: {
          type: 'string',
          description: 'Start time (ISO 8601 format)',
        },
        end: {
          type: 'string',
          description: 'End time (ISO 8601 format)',
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of attendee email addresses',
        },
        location: {
          type: 'string',
          description: 'Event location',
        },
        timeZone: {
          type: 'string',
          description: 'Time zone (default: Asia/Jerusalem)',
        },
      },
      required: ['summary', 'start', 'end'],
    },
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Event ID to update',
        },
        summary: {
          type: 'string',
          description: 'New event title',
        },
        description: {
          type: 'string',
          description: 'New event description',
        },
        location: {
          type: 'string',
          description: 'New event location',
        },
        start: {
          type: 'string',
          description: 'New start time (ISO 8601)',
        },
        end: {
          type: 'string',
          description: 'New end time (ISO 8601)',
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'New attendee list',
        },
        timeZone: {
          type: 'string',
          description: 'Time zone',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete a calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Event ID to delete',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_find_free_slots',
    description: 'Find available time slots within a date range.',
    inputSchema: {
      type: 'object',
      properties: {
        timeMin: {
          type: 'string',
          description: 'Start time (ISO 8601 format)',
        },
        timeMax: {
          type: 'string',
          description: 'End time (ISO 8601 format)',
        },
        duration: {
          type: 'number',
          description: 'Duration of each slot in minutes (default: 60)',
          minimum: 15,
        },
      },
      required: ['timeMin', 'timeMax'],
    },
  },
  {
    name: 'calendar_get_today_events',
    description: 'Get all events scheduled for today.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'calendar_get_week_events',
    description: 'Get all events scheduled for the next 7 days.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Main server class
 */
class GmailMCPServer {
  private server: Server;
  private gmailClient: GmailClient | null = null;
  private calendarClient: CalendarClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'gmail-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Initialize clients as needed
      if (name.startsWith('gmail_') && !this.gmailClient) {
        this.gmailClient = await GmailClient.create();
      }
      if (name.startsWith('calendar_') && !this.calendarClient) {
        this.calendarClient = await CalendarClient.create();
      }

      try {
        switch (name) {
          case 'gmail_search_messages': {
            const result = await this.gmailClient!.searchMessages(args as SearchMessagesInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_get_message': {
            const result = await this.gmailClient!.getMessage(args as unknown as GetMessageInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_send_message': {
            const result = await this.gmailClient!.sendMessage(args as unknown as SendMessageInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_modify_message': {
            const result = await this.gmailClient!.modifyMessage(args as unknown as ModifyMessageInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_delete_message': {
            const result = await this.gmailClient!.deleteMessage(args as unknown as DeleteMessageInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_create_draft': {
            const result = await this.gmailClient!.createDraft(args as unknown as CreateDraftInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_list_labels': {
            const result = await this.gmailClient!.listLabels();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_create_label': {
            const result = await this.gmailClient!.createLabel(args as unknown as CreateLabelInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gmail_get_attachment': {
            const result = await this.gmailClient!.getAttachment(args as unknown as GetAttachmentInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Calendar tools
          case 'calendar_list_events': {
            const result = await this.calendarClient!.listEvents(args as unknown as ListEventsInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'calendar_get_event': {
            const result = await this.calendarClient!.getEvent((args as unknown as GetEventInput).eventId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'calendar_create_event': {
            const result = await this.calendarClient!.createEvent(args as unknown as CreateEventInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'calendar_update_event': {
            const { eventId, ...updates } = args as unknown as UpdateEventInput;
            const result = await this.calendarClient!.updateEvent(eventId, updates);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'calendar_delete_event': {
            await this.calendarClient!.deleteEvent((args as unknown as DeleteEventInput).eventId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success: true, message: 'Event deleted successfully' }, null, 2),
                },
              ],
            };
          }

          case 'calendar_find_free_slots': {
            const result = await this.calendarClient!.findFreeSlots(args as unknown as FindFreeSlotsInput);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'calendar_get_today_events': {
            const result = await this.calendarClient!.getTodayEvents();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'calendar_get_week_events': {
            const result = await this.calendarClient!.getWeekEvents();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: {
                  code: 'TOOL_ERROR',
                  message: errorMessage,
                  retryable: false,
                },
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gmail MCP Server running on stdio');
  }

  async startHttp() {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'gmail-mcp-server',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        tools: TOOLS.length
      });
    });

    // Root endpoint
    app.get('/', (_req, res) => {
      res.json({
        name: 'Gmail MCP Server',
        version: '0.1.0',
        description: 'MCP server providing Gmail and Calendar integration',
        endpoints: {
          health: '/health',
          mcp: '/mcp (POST for SSE connection)'
        },
        tools: TOOLS.length,
        capabilities: ['gmail', 'calendar']
      });
    });

    // MCP endpoint with SSE transport
    app.post('/mcp', async (_req, res) => {
      console.log('📨 New MCP connection established');

      const transport = new SSEServerTransport('/mcp', res);
      await this.server.connect(transport);

      console.log('✅ MCP client connected via SSE');
    });

    // Start HTTP server - bind to 0.0.0.0 for Cloud Run
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Gmail/Calendar MCP Server (HTTP Mode)             ║
╠═══════════════════════════════════════════════════════════╣
║  Status: Running                                          ║
║  Port: ${PORT}                                             ║
║  Mode: Cloud (HTTP/SSE)                                   ║
║  Tools: ${TOOLS.length} available                                   ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    Health Check: http://0.0.0.0:${PORT}/health           ║
║    MCP Endpoint: http://0.0.0.0:${PORT}/mcp (POST)       ║
║    Info: http://0.0.0.0:${PORT}/                         ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  }
}

// Start the server based on mode
const mcpServer = new GmailMCPServer();

if (IS_CLOUD_MODE) {
  console.log('🌐 Starting in CLOUD mode (HTTP/SSE transport)...');
  mcpServer.startHttp().catch(console.error);
} else {
  console.log('💻 Starting in LOCAL mode (stdio transport)...');
  mcpServer.startStdio().catch(console.error);
}
