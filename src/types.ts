/**
 * Type definitions for Gmail MCP Server
 */

import { gmail_v1, calendar_v3 } from 'googleapis';

// Gmail API types
export type GmailMessage = gmail_v1.Schema$Message;
export type GmailThread = gmail_v1.Schema$Thread;
export type GmailLabel = gmail_v1.Schema$Label;
export type GmailDraft = gmail_v1.Schema$Draft;

// Calendar API types
export type CalendarEvent = calendar_v3.Schema$Event;

// Custom message summary type
export interface MessageSummary {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: number;
  from: string;
  subject: string;
  date: string;
  hasAttachments: boolean;
}

// Full message type
export interface FullMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: number;
  headers: Record<string, string>;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  date: string;
  body: {
    plain?: string;
    html?: string;
  };
  attachments: Attachment[];
}

// Attachment metadata
export interface Attachment {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

// Label type
export interface Label {
  id: string;
  name: string;
  type: 'system' | 'user';
  messageListVisibility: string;
  labelListVisibility: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

// Tool input schemas
export interface SearchMessagesInput {
  query?: string;
  maxResults?: number;
  labelIds?: string[];
  includeSpamTrash?: boolean;
  pageToken?: string;
}

export interface GetMessageInput {
  messageId: string;
  format?: 'full' | 'metadata' | 'minimal' | 'raw';
}

export interface SendMessageInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  contentType?: 'text/plain' | 'text/html';
  attachments?: {
    filename: string;
    mimeType: string;
    content: string; // base64
  }[];
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface ModifyMessageInput {
  messageId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}

export interface DeleteMessageInput {
  messageId: string;
  permanent?: boolean;
}

export interface CreateDraftInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  contentType?: 'text/plain' | 'text/html';
  attachments?: {
    filename: string;
    mimeType: string;
    content: string; // base64
  }[];
}

export interface CreateLabelInput {
  name: string;
  labelListVisibility?: 'labelShow' | 'labelHide' | 'labelShowIfUnread';
  messageListVisibility?: 'show' | 'hide';
}

export interface GetAttachmentInput {
  messageId: string;
  attachmentId: string;
}

// OAuth configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Error response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
  };
}

// Calendar tool input schemas
export interface ListEventsInput {
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
  q?: string;
}

export interface GetEventInput {
  eventId: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
  timeZone?: string;
}

export interface UpdateEventInput {
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  attendees?: string[];
  timeZone?: string;
}

export interface DeleteEventInput {
  eventId: string;
}

export interface FindFreeSlotsInput {
  timeMin: string;
  timeMax: string;
  duration?: number;
}
