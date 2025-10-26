# Gmail & Calendar MCP Server

A Model Context Protocol (MCP) server that provides Gmail and Google Calendar integration, enabling AI assistants to manage emails and calendar events.

## ✨ Features

### Gmail Integration (9 tools)
- Search and read Gmail messages
- Send emails with attachments
- Manage labels and folders
- Modify message states (read/unread, archive, star, etc.)
- Create drafts
- Handle attachments

### Calendar Integration (8 tools)
- List and search calendar events
- Create, update, and delete events
- Find free time slots
- Get today's or week's schedule
- Manage attendees and locations

### Deployment Options
- **Local Development**: stdio transport for direct process communication
- **Cloud Deployment**: HTTP/SSE transport for Google Cloud Run
- **Automatic Mode Detection**: Switches based on environment
- **Secure Credentials**: Google Cloud Secret Manager integration

## Prerequisites

- Node.js >= 18.0.0
- A Google Cloud Project with Gmail API enabled
- OAuth 2.0 credentials (Desktop app)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OAuth Credentials

You should already have a `client_secret_*.json` file in this directory from Google Cloud Console.

### 3. Build the Project

```bash
npm run build
```

### 4. Authenticate with Gmail

Run the authentication script to get your OAuth token:

```bash
npm run auth
```

This will:
1. Open a browser window for you to authorize the app
2. Save the refresh token to `token.json`
3. You only need to do this once

### 5. Run the MCP Server

```bash
npm start
```

Or for development with auto-rebuild:

```bash
npm run dev
```

## ☁️ Cloud Deployment (Google Cloud Run)

Your server is **cloud-ready**! It supports automatic detection and switching between local (stdio) and cloud (HTTP/SSE) modes.

### Quick Deploy

```bash
# 1. Setup OAuth secrets in Google Cloud
./setup-secrets.sh YOUR_PROJECT_ID

# 2. Deploy to Cloud Run
./deploy.sh YOUR_PROJECT_ID us-central1

# 3. Your server is live!
# https://gmail-mcp-server-xxxxx-uc.a.run.app
```

### Test Cloud Endpoints

```bash
# Health check
curl https://YOUR-SERVICE-URL/health

# Server info
curl https://YOUR-SERVICE-URL/
```

### Documentation
- **Quick Start**: See [CLOUD_READY.md](./CLOUD_READY.md)
- **Complete Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Fast Deploy**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

## Project Structure

```
gmail/
├── src/
│   ├── index.ts          # Main MCP server (dual transport)
│   ├── auth.ts           # OAuth authentication (Secret Manager support)
│   ├── gmail.ts          # Gmail API client
│   ├── calendar.ts       # Calendar API client
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript
├── Dockerfile            # Container configuration
├── cloudbuild.yaml       # CI/CD configuration
├── deploy.sh             # Deployment script
├── setup-secrets.sh      # Secret Manager setup
├── client_secret_*.json  # OAuth credentials (DO NOT COMMIT)
├── token.json           # OAuth refresh token (DO NOT COMMIT)
├── package.json
├── tsconfig.json
├── README.md
├── DESIGN.md            # Design documentation
├── DEPLOYMENT_GUIDE.md  # Complete deployment guide
├── CLOUD_READY.md       # Cloud conversion summary
└── QUICK_DEPLOY.md      # Quick deployment reference
```

## Available Tools (17 total)

### Gmail Tools (9)
- `gmail_search_messages` - Search for messages
- `gmail_get_message` - Get a specific message
- `gmail_send_message` - Send an email
- `gmail_modify_message` - Modify message labels
- `gmail_delete_message` - Delete or trash a message
- `gmail_create_draft` - Create a draft
- `gmail_list_labels` - List all labels
- `gmail_create_label` - Create a new label
- `gmail_get_attachment` - Download an attachment

### Calendar Tools (8)
- `calendar_list_events` - List calendar events
- `calendar_get_event` - Get specific event details
- `calendar_create_event` - Create new event
- `calendar_update_event` - Update existing event
- `calendar_delete_event` - Delete an event
- `calendar_find_free_slots` - Find available time slots
- `calendar_get_today_events` - Get today's schedule
- `calendar_get_week_events` - Get this week's events

See [DESIGN.md](./DESIGN.md) for complete API documentation.

## Security

- Never commit `client_secret_*.json` or `token.json` files
- OAuth tokens are stored locally with restricted permissions
- The app requests minimal required scopes

## Development

Watch mode for auto-rebuild:

```bash
npm run watch
```

## License

MIT
