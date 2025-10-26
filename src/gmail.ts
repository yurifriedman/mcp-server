/**
 * Gmail API client wrapper
 */

import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getAuthenticatedClient } from './auth.js';
import {
  MessageSummary,
  FullMessage,
  Label,
  Attachment,
  SearchMessagesInput,
  GetMessageInput,
  SendMessageInput,
  ModifyMessageInput,
  DeleteMessageInput,
  CreateDraftInput,
  CreateLabelInput,
  GetAttachmentInput,
} from './types.js';

export class GmailClient {
  private gmail: gmail_v1.Gmail;

  private constructor(auth: OAuth2Client) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  /**
   * Create and initialize Gmail client
   */
  static async create(): Promise<GmailClient> {
    const auth = await getAuthenticatedClient();
    return new GmailClient(auth);
  }

  /**
   * Extract header value from message
   */
  private getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
    const header = headers?.find(h => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  }

  /**
   * Parse email addresses from header
   */
  private parseEmailAddresses(header: string): string[] {
    if (!header) return [];
    return header.split(',').map(email => email.trim());
  }

  /**
   * Convert Gmail message to MessageSummary
   */
  private toMessageSummary(message: gmail_v1.Schema$Message): MessageSummary {
    const headers = message.payload?.headers || [];
    const from = this.getHeader(headers, 'from');
    const subject = this.getHeader(headers, 'subject');
    const date = this.getHeader(headers, 'date');

    return {
      id: message.id!,
      threadId: message.threadId!,
      labelIds: message.labelIds || [],
      snippet: message.snippet || '',
      internalDate: parseInt(message.internalDate || '0'),
      from,
      subject,
      date,
      hasAttachments: this.hasAttachments(message),
    };
  }

  /**
   * Check if message has attachments
   */
  private hasAttachments(message: gmail_v1.Schema$Message): boolean {
    const parts = message.payload?.parts || [];
    return parts.some(part => part.filename && part.body?.attachmentId);
  }

  /**
   * Extract attachments from message
   */
  private extractAttachments(message: gmail_v1.Schema$Message): Attachment[] {
    const attachments: Attachment[] = [];
    const parts = message.payload?.parts || [];

    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        });
      }
    }

    return attachments;
  }

  /**
   * Extract message body
   */
  private extractBody(message: gmail_v1.Schema$Message): { plain?: string; html?: string } {
    const body: { plain?: string; html?: string } = {};

    const getBodyFromPart = (part: gmail_v1.Schema$MessagePart): void => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body.plain = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        body.html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      if (part.parts) {
        part.parts.forEach(getBodyFromPart);
      }
    };

    if (message.payload) {
      getBodyFromPart(message.payload);
    }

    return body;
  }

  /**
   * Convert Gmail message to FullMessage
   */
  private toFullMessage(message: gmail_v1.Schema$Message): FullMessage {
    const headers = message.payload?.headers || [];
    const headersMap: Record<string, string> = {};

    headers.forEach(h => {
      if (h.name && h.value) {
        headersMap[h.name] = h.value;
      }
    });

    const from = this.getHeader(headers, 'from');
    const to = this.parseEmailAddresses(this.getHeader(headers, 'to'));
    const cc = this.parseEmailAddresses(this.getHeader(headers, 'cc'));
    const bcc = this.parseEmailAddresses(this.getHeader(headers, 'bcc'));
    const subject = this.getHeader(headers, 'subject');
    const date = this.getHeader(headers, 'date');

    return {
      id: message.id!,
      threadId: message.threadId!,
      labelIds: message.labelIds || [],
      snippet: message.snippet || '',
      historyId: message.historyId || '',
      internalDate: parseInt(message.internalDate || '0'),
      headers: headersMap,
      from,
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      date,
      body: this.extractBody(message),
      attachments: this.extractAttachments(message),
    };
  }

  /**
   * Search messages
   */
  async searchMessages(input: SearchMessagesInput): Promise<{ messages: MessageSummary[]; nextPageToken?: string }> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: input.query,
      maxResults: input.maxResults || 50,
      labelIds: input.labelIds,
      includeSpamTrash: input.includeSpamTrash || false,
      pageToken: input.pageToken,
    });

    const messageList = response.data.messages || [];
    const messages: MessageSummary[] = [];

    for (const msg of messageList) {
      const fullMsg = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
      });

      messages.push(this.toMessageSummary(fullMsg.data));
    }

    return {
      messages,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  /**
   * Get a specific message
   */
  async getMessage(input: GetMessageInput): Promise<FullMessage> {
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: input.messageId,
      format: input.format || 'full',
    });

    return this.toFullMessage(response.data);
  }

  /**
   * Create MIME message for sending
   */
  private createMimeMessage(input: SendMessageInput): string {
    const boundary = '----=_Part_' + Date.now();
    const lines: string[] = [];

    // Headers
    lines.push(`To: ${input.to.join(', ')}`);
    if (input.cc && input.cc.length > 0) {
      lines.push(`Cc: ${input.cc.join(', ')}`);
    }
    if (input.bcc && input.bcc.length > 0) {
      lines.push(`Bcc: ${input.bcc.join(', ')}`);
    }
    lines.push(`Subject: ${input.subject}`);
    if (input.threadId) {
      lines.push(`Thread-Id: ${input.threadId}`);
    }
    if (input.inReplyTo) {
      lines.push(`In-Reply-To: ${input.inReplyTo}`);
    }
    if (input.references) {
      lines.push(`References: ${input.references}`);
    }

    if (input.attachments && input.attachments.length > 0) {
      lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
    }

    lines.push(`Content-Type: ${input.contentType || 'text/plain'}; charset=utf-8`);
    lines.push('');
    lines.push(input.body);

    // Attachments
    if (input.attachments) {
      for (const attachment of input.attachments) {
        lines.push('');
        lines.push(`--${boundary}`);
        lines.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
        lines.push('Content-Transfer-Encoding: base64');
        lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        lines.push('');
        lines.push(attachment.content);
      }
      lines.push(`--${boundary}--`);
    }

    return lines.join('\r\n');
  }

  /**
   * Send a message
   */
  async sendMessage(input: SendMessageInput): Promise<FullMessage> {
    const mimeMessage = this.createMimeMessage(input);
    const encodedMessage = Buffer.from(mimeMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: input.threadId,
      },
    });

    return this.toFullMessage(response.data);
  }

  /**
   * Modify message labels
   */
  async modifyMessage(input: ModifyMessageInput): Promise<FullMessage> {
    const response = await this.gmail.users.messages.modify({
      userId: 'me',
      id: input.messageId,
      requestBody: {
        addLabelIds: input.addLabelIds,
        removeLabelIds: input.removeLabelIds,
      },
    });

    return this.toFullMessage(response.data);
  }

  /**
   * Delete a message
   */
  async deleteMessage(input: DeleteMessageInput): Promise<{ success: boolean }> {
    if (input.permanent) {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: input.messageId,
      });
    } else {
      await this.gmail.users.messages.trash({
        userId: 'me',
        id: input.messageId,
      });
    }

    return { success: true };
  }

  /**
   * Create a draft
   */
  async createDraft(input: CreateDraftInput): Promise<{ draftId: string }> {
    const mimeMessage = this.createMimeMessage({
      ...input,
      contentType: input.contentType,
    });
    const encodedMessage = Buffer.from(mimeMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });

    return { draftId: response.data.id! };
  }

  /**
   * List all labels
   */
  async listLabels(): Promise<Label[]> {
    const response = await this.gmail.users.labels.list({
      userId: 'me',
    });

    const labels: Label[] = [];
    for (const label of response.data.labels || []) {
      labels.push({
        id: label.id!,
        name: label.name!,
        type: label.type as 'system' | 'user',
        messageListVisibility: label.messageListVisibility || 'show',
        labelListVisibility: label.labelListVisibility || 'labelShow',
        messagesTotal: label.messagesTotal ?? undefined,
        messagesUnread: label.messagesUnread ?? undefined,
      });
    }

    return labels;
  }

  /**
   * Create a new label
   */
  async createLabel(input: CreateLabelInput): Promise<Label> {
    const response = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: input.name,
        labelListVisibility: input.labelListVisibility,
        messageListVisibility: input.messageListVisibility,
      },
    });

    const label = response.data;
    return {
      id: label.id!,
      name: label.name!,
      type: label.type as 'system' | 'user',
      messageListVisibility: label.messageListVisibility || 'show',
      labelListVisibility: label.labelListVisibility || 'labelShow',
    };
  }

  /**
   * Get an attachment
   */
  async getAttachment(input: GetAttachmentInput): Promise<{ data: string; filename: string; mimeType: string }> {
    const message = await this.gmail.users.messages.get({
      userId: 'me',
      id: input.messageId,
    });

    const attachment = this.extractAttachments(message.data).find(a => a.attachmentId === input.attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    const response = await this.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: input.messageId,
      id: input.attachmentId,
    });

    return {
      data: response.data.data!,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    };
  }
}
