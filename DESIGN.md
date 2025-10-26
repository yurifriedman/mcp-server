# Gmail MCP Server - Design Document

## Overview

This document outlines the design for a Model Context Protocol (MCP) server that provides integration with Gmail. The server will enable AI assistants to interact with Gmail on behalf of users through a secure, well-defined interface.

## Goals

- Provide read access to Gmail messages with flexible filtering
- Enable message composition and sending
- Support message management (archive, delete, mark as read/unread)
- Implement label/folder management
- Maintain security through OAuth 2.0 authentication
- Follow Gmail API best practices and rate limits
- Provide a clean, type-safe interface

## Non-Goals

- Direct IMAP/POP3 protocol implementation (will use Gmail API)
- Email parsing beyond what Gmail API provides
- Calendar or Contacts integration (separate MCP servers)
- Advanced email filtering rules management
- Gmail settings modification

## Architecture

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **Gmail Integration**: Google APIs Node.js Client (@googleapis/gmail)
- **Authentication**: OAuth 2.0 with googleapis auth library
- **Build Tool**: TypeScript compiler
- **Package Manager**: npm

### Authentication Flow

1. Server starts and loads OAuth 2.0 credentials from environment/config
2. On first run, initiates OAuth flow to obtain refresh token
3. Stores refresh token securely (file system with appropriate permissions)
4. Subsequent runs use refresh token to obtain access tokens
5. Automatically refreshes access tokens as needed

### Configuration

Required environment variables:
- `GMAIL_CLIENT_ID`: OAuth 2.0 client ID
- `GMAIL_CLIENT_SECRET`: OAuth 2.0 client secret
- `GMAIL_REDIRECT_URI`: OAuth redirect URI (default: http://localhost:3000/oauth2callback)
- `GMAIL_TOKEN_PATH`: Path to store refresh token (default: ~/.gmail-mcp-token.json)

Optional configuration:
- `GMAIL_MAX_RESULTS`: Default max results per query (default: 50, max: 500)
- `GMAIL_RATE_LIMIT_DELAY`: Delay between API calls in ms (default: 100)

## MCP Resources

The server will expose Gmail data through MCP resources:

### Resource: `gmail://messages`

List and search messages.

**URI Template**: `gmail://messages?query={query}&maxResults={max}&pageToken={token}`

**Parameters**:
- `query` (optional): Gmail search query (e.g., "from:example@gmail.com is:unread")
- `maxResults` (optional): Number of results (1-500, default: 50)
- `pageToken` (optional): Pagination token

**Returns**: List of message summaries with id, threadId, snippet, labels, date

### Resource: `gmail://message/{messageId}`

Get a specific message with full details.

**URI Template**: `gmail://message/{messageId}?format={format}`

**Parameters**:
- `messageId` (required): Gmail message ID
- `format` (optional): full | metadata | minimal | raw (default: full)

**Returns**: Complete message including headers, body, attachments metadata

### Resource: `gmail://labels`

List all labels/folders.

**URI Template**: `gmail://labels`

**Returns**: List of labels with id, name, type, messageListVisibility

### Resource: `gmail://thread/{threadId}`

Get all messages in a thread.

**URI Template**: `gmail://thread/{threadId}`

**Parameters**:
- `threadId` (required): Gmail thread ID

**Returns**: Complete thread with all messages

## MCP Tools

The server will provide the following tools:

### Tool: `gmail_search_messages`

Search for messages using Gmail query syntax.

**Input Schema**:
```typescript
{
  query: string;           // Gmail search query
  maxResults?: number;     // Max results (1-500)
  labelIds?: string[];     // Filter by labels
  includeSpamTrash?: boolean; // Include spam/trash (default: false)
  pageToken?: string;      // Pagination token
}
```

**Output**: Array of message summaries with pagination token

### Tool: `gmail_get_message`

Retrieve a specific message by ID.

**Input Schema**:
```typescript
{
  messageId: string;       // Gmail message ID
  format?: 'full' | 'metadata' | 'minimal' | 'raw';
}
```

**Output**: Full message object

### Tool: `gmail_send_message`

Compose and send a new email.

**Input Schema**:
```typescript
{
  to: string[];            // Recipients
  cc?: string[];           // CC recipients
  bcc?: string[];          // BCC recipients
  subject: string;         // Email subject
  body: string;            // Email body (plain text or HTML)
  contentType?: 'text/plain' | 'text/html'; // Default: text/plain
  attachments?: Array<{
    filename: string;
    mimeType: string;
    content: string;       // Base64 encoded
  }>;
  threadId?: string;       // Reply to thread
  inReplyTo?: string;      // In-Reply-To header
  references?: string;     // References header
}
```

**Output**: Sent message object with messageId

### Tool: `gmail_modify_message`

Modify message labels (archive, mark read, etc).

**Input Schema**:
```typescript
{
  messageId: string;       // Message ID
  addLabelIds?: string[];  // Labels to add
  removeLabelIds?: string[]; // Labels to remove
}
```

**Output**: Updated message object

**Common Operations**:
- Mark as read: `removeLabelIds: ['UNREAD']`
- Mark as unread: `addLabelIds: ['UNREAD']`
- Archive: `removeLabelIds: ['INBOX']`
- Move to inbox: `addLabelIds: ['INBOX']`
- Star: `addLabelIds: ['STARRED']`

### Tool: `gmail_delete_message`

Move message to trash or permanently delete.

**Input Schema**:
```typescript
{
  messageId: string;       // Message ID
  permanent?: boolean;     // Permanently delete (default: false, moves to trash)
}
```

**Output**: Success confirmation

### Tool: `gmail_create_draft`

Create a draft message.

**Input Schema**:
```typescript
{
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  contentType?: 'text/plain' | 'text/html';
  attachments?: Array<{
    filename: string;
    mimeType: string;
    content: string;
  }>;
}
```

**Output**: Draft object with draftId

### Tool: `gmail_list_labels`

List all available labels.

**Input Schema**: (none)

**Output**: Array of label objects

### Tool: `gmail_create_label`

Create a new label.

**Input Schema**:
```typescript
{
  name: string;            // Label name
  labelListVisibility?: 'show' | 'hide' | 'showIfUnread';
  messageListVisibility?: 'show' | 'hide';
}
```

**Output**: Created label object

### Tool: `gmail_get_attachment`

Download an attachment.

**Input Schema**:
```typescript
{
  messageId: string;       // Message ID
  attachmentId: string;    // Attachment ID (from message object)
}
```

**Output**: Attachment data (base64 encoded) with metadata

## Data Models

### Message Summary
```typescript
interface MessageSummary {
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
```

### Full Message
```typescript
interface FullMessage {
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
```

### Attachment
```typescript
interface Attachment {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}
```

### Label
```typescript
interface Label {
  id: string;
  name: string;
  type: 'system' | 'user';
  messageListVisibility: 'show' | 'hide';
  labelListVisibility: 'show' | 'hide' | 'showIfUnread';
  messagesTotal?: number;
  messagesUnread?: number;
}
```

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials
   - Expired tokens
   - Missing OAuth consent
   - Action: Prompt re-authentication

2. **API Errors**
   - Rate limit exceeded (429)
   - Invalid request (400)
   - Not found (404)
   - Server errors (500+)
   - Action: Retry with exponential backoff for transient errors

3. **Validation Errors**
   - Invalid email addresses
   - Missing required fields
   - Invalid message IDs
   - Action: Return descriptive error message

4. **Network Errors**
   - Timeout
   - Connection refused
   - Action: Retry with backoff

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;         // ERROR_CODE
    message: string;      // Human-readable message
    details?: any;        // Additional context
    retryable: boolean;   // Whether client should retry
  };
}
```

## Rate Limiting

Gmail API quotas (as of 2024):
- 250 quota units per user per second
- 1 billion quota units per day

Strategy:
- Implement token bucket rate limiter
- Queue requests when approaching limits
- Exponential backoff on 429 responses
- Batch operations where possible

## Security Considerations

1. **OAuth Token Storage**
   - Store refresh tokens with restrictive file permissions (600)
   - Never log tokens
   - Support token encryption at rest

2. **Input Validation**
   - Validate all email addresses
   - Sanitize message content
   - Limit attachment sizes
   - Validate message IDs format

3. **Scope Minimization**
   - Request minimum required OAuth scopes:
     - `https://www.googleapis.com/auth/gmail.modify` (read/modify/send)
     - Or more restrictive scopes if send is not needed

4. **Data Privacy**
   - Don't cache email content unnecessarily
   - Respect user's data retention policies
   - Clear sensitive data from memory

## Testing Strategy

### Unit Tests
- Message parsing and formatting
- OAuth token refresh logic
- Error handling
- Rate limiting logic

### Integration Tests
- Gmail API interactions (using test account)
- Search functionality
- Send/receive flow
- Label operations
- Attachment handling

### Manual Testing
- OAuth flow (first-time setup)
- Various email formats
- Large attachments
- Thread operations
- Edge cases (very long subjects, special characters, etc.)

## Deployment Considerations

1. **Initial Setup**
   - Provide clear documentation for OAuth client creation
   - Include step-by-step authentication setup
   - Provide example configuration file

2. **Monitoring**
   - Log API usage metrics
   - Track error rates
   - Monitor rate limit consumption

3. **Updates**
   - Keep googleapis library updated
   - Monitor Gmail API changelog
   - Version MCP protocol interface

## Future Enhancements

Potential features for future versions:

1. **Advanced Search**
   - Saved search queries
   - Search suggestions

2. **Batch Operations**
   - Bulk modify messages
   - Bulk delete

3. **Filters**
   - Read filter rules
   - Create/modify filters (if requested)

4. **Push Notifications**
   - Watch for new messages
   - Webhook support via Gmail push notifications

5. **Enhanced Attachments**
   - Inline image handling
   - Attachment preview generation

6. **Performance**
   - Message caching layer
   - Partial sync for large mailboxes

7. **Analytics**
   - Message statistics
   - Sender analysis

## Implementation Phases

### Phase 1: Core Functionality (MVP)
- OAuth authentication
- Search messages
- Get message details
- Send simple messages
- Basic label operations

### Phase 2: Enhanced Features
- Reply to messages
- Attachment support
- Thread operations
- Draft management
- Advanced label management

### Phase 3: Polish & Optimization
- Rate limiting optimization
- Caching layer
- Enhanced error handling
- Comprehensive testing
- Documentation

## Success Metrics

- Successfully authenticate and maintain connection
- Handle 100+ messages/minute without rate limiting
- <500ms average response time for message retrieval
- <2s average response time for message sending
- 99.9% uptime (excluding Gmail API outages)
- Zero security incidents

## References

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [MCP Specification](https://modelcontextprotocol.io)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Node.js Quickstart](https://developers.google.com/gmail/api/quickstart/nodejs)
