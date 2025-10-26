# Gmail MCP Server & Automated Email System - Complete Setup Manual

**Author:** Claude AI Assistant
**Date:** October 19, 2025
**Purpose:** Step-by-step guide to set up Gmail MCP server with Claude Code and create automated email campaigns

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Google Cloud Platform Setup](#2-google-cloud-platform-setup)
3. [Gmail MCP Server Installation](#3-gmail-mcp-server-installation)
4. [OAuth Authentication Setup](#4-oauth-authentication-setup)
5. [Claude Code MCP Configuration](#5-claude-code-mcp-configuration)
6. [Testing the Gmail MCP Server](#6-testing-the-gmail-mcp-server)
7. [Creating Automated Email Scripts](#7-creating-automated-email-scripts)
8. [Advanced Use Cases](#8-advanced-use-cases)
9. [Troubleshooting](#9-troubleshooting)
10. [Security Best Practices](#10-security-best-practices)

---

## 1. Prerequisites

Before you begin, ensure you have:

### Required Software
- **Node.js** (version 18.0.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

- **Claude Code** installed
  - Installation guide: https://docs.claude.com/en/docs/claude-code

- **Git for Windows** (if on Windows)
  - Download from: https://git-scm.com/download/win

### Required Accounts
- **Google Account** with Gmail access
- **Google Cloud Platform** account (free tier is sufficient)
- **Claude Code** account

### Recommended Knowledge
- Basic command line usage
- Basic understanding of JSON format
- Basic JavaScript (helpful but not required)

---

## 2. Google Cloud Platform Setup

### Step 2.1: Create a Google Cloud Project

1. Go to **Google Cloud Console**: https://console.cloud.google.com/

2. Click on the project dropdown (top left, near "Google Cloud")

3. Click **"NEW PROJECT"**

4. Fill in project details:
   - **Project Name:** `Gmail MCP Server` (or your preferred name)
   - **Organization:** Leave as default (No organization)
   - Click **"CREATE"**

5. Wait for project creation (usually 10-30 seconds)

6. Select your newly created project from the dropdown

### Step 2.2: Enable Gmail API

1. In the Google Cloud Console, go to **"APIs & Services" > "Library"**
   - Or use this direct link: https://console.cloud.google.com/apis/library

2. In the search bar, type: **"Gmail API"**

3. Click on **"Gmail API"** from the results

4. Click the **"ENABLE"** button

5. Wait for the API to be enabled (usually instant)

### Step 2.3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" > "Credentials"**
   - Or use: https://console.cloud.google.com/apis/credentials

2. Click **"+ CREATE CREDENTIALS"** at the top

3. Select **"OAuth client ID"**

4. If you see "To create an OAuth client ID, you must first configure your consent screen":

   **Configure OAuth Consent Screen:**
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Select **"External"** (unless you have a Google Workspace)
   - Click **"CREATE"**

   **Fill in OAuth consent screen information:**
   - **App name:** `Gmail MCP Server`
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   - Click **"SAVE AND CONTINUE"**

   **Scopes:**
   - Click **"ADD OR REMOVE SCOPES"**
   - Search for and select: `https://www.googleapis.com/auth/gmail.modify`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

   **Test users:**
   - Click **"+ ADD USERS"**
   - Enter your Gmail address
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

   **Summary:**
   - Review and click **"BACK TO DASHBOARD"**

5. Now go back to **"Credentials"** tab

6. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**

7. Configure OAuth client:
   - **Application type:** Select **"Desktop app"**
   - **Name:** `Gmail MCP Desktop Client`
   - Click **"CREATE"**

8. A popup will appear with your credentials:
   - Click **"DOWNLOAD JSON"**
   - Save the file (it will be named something like `client_secret_XXXXX.json`)
   - **IMPORTANT:** Keep this file secure and never share it publicly
   - Click **"OK"** to close the popup

---

## 3. Gmail MCP Server Installation

### Step 3.1: Prepare Installation Directory

1. Open your terminal/command prompt

2. Navigate to Claude Code's MCP servers directory:

   **On Windows:**
   ```bash
   cd C:\Users\[YourUsername]\.claude\mcp-servers\specs
   ```

   **On macOS/Linux:**
   ```bash
   cd ~/.claude/mcp-servers/specs
   ```

   If the directory doesn't exist, create it:
   ```bash
   mkdir -p ~/.claude/mcp-servers/specs
   cd ~/.claude/mcp-servers/specs
   ```

### Step 3.2: Create Gmail MCP Server Directory

1. Create the Gmail directory:
   ```bash
   mkdir gmail
   cd gmail
   ```

### Step 3.3: Initialize Node.js Project

1. Create package.json:
   ```bash
   npm init -y
   ```

2. Install required dependencies:
   ```bash
   npm install googleapis google-auth-library @modelcontextprotocol/sdk
   ```

3. Update package.json to use ES modules. Edit the file to include:
   ```json
   {
     "type": "module",
     "name": "gmail-mcp-server",
     "version": "0.1.0",
     ...
   }
   ```

### Step 3.4: Move OAuth Credentials File

1. Copy the downloaded `client_secret_*.json` file to your Gmail MCP directory:

   **On Windows:**
   ```bash
   copy C:\Users\[YourUsername]\Downloads\client_secret_*.json .
   ```

   **On macOS/Linux:**
   ```bash
   cp ~/Downloads/client_secret_*.json .
   ```

2. Verify the file is in place:
   ```bash
   ls client_secret_*
   ```
   or on Windows:
   ```bash
   dir client_secret_*
   ```

---

## 4. OAuth Authentication Setup

### Step 4.1: Create Authentication Script

Create a file named `authenticate.js`:

```javascript
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';
import * as http from 'http';
import { URL } from 'url';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = 'token.json';

async function loadCredentials() {
  const files = await fs.readdir(process.cwd());
  const credFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));

  if (!credFile) {
    throw new Error('No client_secret_*.json file found.');
  }

  const content = await fs.readFile(credFile, 'utf-8');
  return JSON.parse(content);
}

async function authenticate() {
  const credentials = await loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  console.log('\\nWaiting for authorization...\\n');

  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/?code=')) {
      const url = new URL(req.url, 'http://localhost');
      const code = url.searchParams.get('code');

      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code);
          await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication successful!</h1><p>You can close this window.</p>');

          console.log('✓ Authentication successful!');
          console.log('Token saved to:', TOKEN_PATH);

          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 1000);
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed!</h1>');
          console.error('Error:', error);
          server.close();
          process.exit(1);
        }
      }
    }
  });

  server.listen(80, () => {
    console.log('Listening on http://localhost');
  });
}

authenticate().catch(console.error);
```

### Step 4.2: Run Authentication

1. Run the authentication script:
   ```bash
   node authenticate.js
   ```

2. The script will output a URL. Copy it and paste into your browser.

3. Sign in with your Google account

4. You may see a warning "Google hasn't verified this app":
   - Click **"Advanced"**
   - Click **"Go to [Your App Name] (unsafe)"**
   - This is safe because it's your own app

5. Grant the requested permissions:
   - Click **"Allow"**

6. You should see "Authentication successful!" in your browser

7. The terminal should show:
   ```
   ✓ Authentication successful!
   Token saved to: token.json
   ```

8. Verify `token.json` was created:
   ```bash
   ls token.json
   ```
   or on Windows:
   ```bash
   dir token.json
   ```

---

## 5. Claude Code MCP Configuration

### Step 5.1: Locate Your Claude Configuration File

The configuration file is located at:

**On Windows:**
```
C:\Users\[YourUsername]\.claude.json
```

**On macOS/Linux:**
```
~/.claude.json
```

### Step 5.2: Add Gmail MCP Server Configuration

1. Open `.claude.json` in a text editor

2. Find the section for your project directory. It will look like:
   ```json
   "C:\\Users\\YourUsername": {
     "mcpServers": {},
     ...
   }
   ```

3. Add the Gmail MCP server configuration inside `mcpServers`:

   **On Windows:**
   ```json
   "mcpServers": {
     "gmail": {
       "command": "node",
       "args": [
         "C:\\Users\\[YourUsername]\\.claude\\mcp-servers\\specs\\gmail\\dist\\index.js"
       ],
       "cwd": "C:\\Users\\[YourUsername]\\.claude\\mcp-servers\\specs\\gmail",
       "disabled": false,
       "alwaysAllow": []
     }
   }
   ```

   **On macOS/Linux:**
   ```json
   "mcpServers": {
     "gmail": {
       "command": "node",
       "args": [
         "/Users/[YourUsername]/.claude/mcp-servers/specs/gmail/dist/index.js"
       ],
       "cwd": "/Users/[YourUsername]/.claude/mcp-servers/specs/gmail",
       "disabled": false,
       "alwaysAllow": []
     }
   }
   ```

4. **IMPORTANT:** Replace `[YourUsername]` with your actual username

5. Save the file

### Step 5.3: Build the MCP Server

Since we haven't created the TypeScript source files yet, you'll need the complete MCP server implementation. For now, let's create a minimal working version.

Create a simple `index.js` file in a `dist` folder:

```bash
mkdir dist
```

Create `dist/index.js` with basic MCP server code (this is a simplified version - you can expand it):

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { google } from 'googleapis';
import * as fs from 'fs/promises';

// Load authentication
async function getAuthClient() {
  const files = await fs.readdir(process.cwd());
  const credFile = files.find(f => f.startsWith('client_secret_'));
  const credentials = JSON.parse(await fs.readFile(credFile, 'utf-8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = JSON.parse(await fs.readFile('token.json', 'utf-8'));
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

// Create MCP server
const server = new Server({
  name: 'gmail-mcp-server',
  version: '0.1.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Implement gmail_send_message tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [{
      name: 'gmail_send_message',
      description: 'Send an email via Gmail',
      inputSchema: {
        type: 'object',
        properties: {
          to: {
            type: 'array',
            items: { type: 'string' },
            description: 'Recipient email addresses'
          },
          subject: {
            type: 'string',
            description: 'Email subject'
          },
          body: {
            type: 'string',
            description: 'Email body content'
          }
        },
        required: ['to', 'subject', 'body']
      }
    }]
  };
});

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'gmail_send_message') {
    const { to, subject, body } = request.params.arguments;

    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const email = [
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\\n');

    const encodedEmail = Buffer.from(email).toString('base64url');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: result.data.id,
          threadId: result.data.threadId
        })
      }]
    };
  }

  throw new Error('Unknown tool');
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Step 5.4: Restart Claude Code

1. Exit Claude Code:
   ```
   /exit
   ```

2. Restart Claude Code from your working directory

3. Verify MCP server is loaded:
   ```
   /mcp
   ```

You should see the Gmail MCP server listed.

---

## 6. Testing the Gmail MCP Server

### Step 6.1: Send a Test Email via MCP

In Claude Code, try:

```
Send me a test email to [your-email@gmail.com] with subject "Test" and body "This is a test email from Gmail MCP"
```

Claude should use the `gmail_send_message` tool to send the email.

### Step 6.2: Create a Standalone Test Script

Create `send-test-email.js`:

```javascript
import { GmailClient } from './dist/gmail.js';

async function sendTestEmail() {
  try {
    console.log('Connecting to Gmail...');
    const client = await GmailClient.create();

    console.log('Sending test email...');
    const result = await client.sendMessage({
      to: ['your-email@gmail.com'],  // Replace with your email
      subject: 'Test Email',
      body: 'This is a test email from the Gmail MCP server!',
      contentType: 'text/plain'
    });

    console.log('\\n✓ Email sent successfully!');
    console.log('Message ID:', result.id);
    console.log('Thread ID:', result.threadId);

  } catch (error) {
    console.error('Error sending email:', error.message);
  }
}

sendTestEmail();
```

Run it:
```bash
node send-test-email.js
```

---

## 7. Creating Automated Email Scripts

### Step 7.1: Simple Automated Email (Every Minute)

Create `send-email-every-minute.js`:

```javascript
import { GmailClient } from './dist/gmail.js';
import * as fs from 'fs/promises';

async function sendEmail() {
  try {
    const now = new Date();
    console.log(\`[\${now.toLocaleTimeString()}] Connecting to Gmail...\`);

    const client = await GmailClient.create();

    console.log(\`[\${now.toLocaleTimeString()}] Sending email...\`);
    const result = await client.sendMessage({
      to: ['your-email@gmail.com'],
      subject: 'Automated Email - ' + now.toLocaleString(),
      body: 'This email was sent automatically every minute.',
      contentType: 'text/plain'
    });

    console.log(\`[\${now.toLocaleTimeString()}] ✓ Email sent!\`);
    console.log(\`  Message ID: \${result.id}\\n\`);

  } catch (error) {
    console.error(\`[\${new Date().toLocaleTimeString()}] Error:\`, error.message);
  }
}

console.log('Starting automated email sender...');
console.log('Emails will be sent every minute.');
console.log('Press Ctrl+C to stop.\\n');

// Send immediately
sendEmail();

// Send every minute (60000 ms)
setInterval(sendEmail, 60000);
```

### Step 7.2: Data-Driven Email Automation

Create `send-strategy-email.js` that reads from an Excel file:

```javascript
import { GmailClient } from './dist/gmail.js';
import XLSX from 'xlsx';

async function sendStrategyEmail() {
  try {
    // Read Excel data
    const workbook = XLSX.readFile('AgentInput.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Analyze data and create email body
    const emailBody = analyzeDataAndCreateStrategy(data);

    // Send email
    const client = await GmailClient.create();
    const now = new Date();

    const result = await client.sendMessage({
      to: ['your-email@gmail.com'],
      subject: \`Strategy Report - \${now.toLocaleString()}\`,
      body: emailBody,
      contentType: 'text/plain'
    });

    console.log('✓ Strategy email sent!');
    console.log('Message ID:', result.id);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

function analyzeDataAndCreateStrategy(data) {
  // Your analysis logic here
  let strategy = 'STRATEGY REPORT\\n';
  strategy += '='.repeat(50) + '\\n\\n';

  // Process data rows
  data.slice(1).forEach(row => {
    strategy += \`Client: \${row[0]}\\n\`;
    strategy += \`Performance: \${row[3]}%\\n\\n\`;
  });

  return strategy;
}

sendStrategyEmail();
```

### Step 7.3: Scheduled Automation (Every 3 Hours)

Create `send-strategy-every-3hours.js`:

```javascript
import { GmailClient } from './dist/gmail.js';
import XLSX from 'xlsx';

async function sendStrategyEmail() {
  try {
    const now = new Date();
    console.log(\`[\${now.toLocaleTimeString()}] Preparing strategy email...\`);

    // Read data from Excel
    const workbook = XLSX.readFile('AgentInput.xlsx');
    const data = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { header: 1 }
    );

    // Create strategy email body
    const emailBody = createStrategyReport(data, now);

    // Send email
    const client = await GmailClient.create();
    const result = await client.sendMessage({
      to: ['your-email@gmail.com'],
      subject: \`Strategy Report - \${now.toLocaleString()}\`,
      body: emailBody,
      contentType: 'text/plain'
    });

    console.log(\`[\${now.toLocaleTimeString()}] ✓ Email sent!\`);
    console.log(\`  Message ID: \${result.id}\\n\`);

  } catch (error) {
    console.error(\`Error:\`, error.message);
  }
}

function createStrategyReport(data, timestamp) {
  // Implement your strategy analysis logic
  return \`Strategy Report Generated: \${timestamp.toLocaleString()}\\n\\n...\`;
}

console.log('Starting automated strategy email sender...');
console.log('Emails will be sent every 3 hours.');
console.log('Press Ctrl+C to stop.\\n');

// Send immediately
sendStrategyEmail();

// Send every 3 hours (10800000 ms = 3 * 60 * 60 * 1000)
setInterval(sendStrategyEmail, 10800000);
```

### Step 7.4: Running Scripts in Background

**On Windows (using PowerShell):**
```powershell
Start-Process node -ArgumentList "send-strategy-every-3hours.js" -NoNewWindow
```

**On macOS/Linux:**
```bash
nohup node send-strategy-every-3hours.js > email-automation.log 2>&1 &
```

To view running Node processes:
```bash
ps aux | grep node
```

To stop a background process:
```bash
kill [process-id]
```

---

## 8. Advanced Use Cases

### Use Case 1: Daily Summary Report

Create a script that runs once daily and sends a summary:

```javascript
import { GmailClient } from './dist/gmail.js';
import XLSX from 'xlsx';

async function sendDailySummary() {
  const workbook = XLSX.readFile('DailyData.xlsx');
  const data = XLSX.utils.sheet_to_json(workbook.Sheets['Summary']);

  const summary = \`
DAILY SUMMARY REPORT
Generated: \${new Date().toLocaleDateString()}

Total Revenue: $\${data.reduce((sum, row) => sum + row.revenue, 0)}
Total Clients: \${data.length}
Top Performer: \${data.sort((a,b) => b.revenue - a.revenue)[0].client}

...\`;

  const client = await GmailClient.create();
  await client.sendMessage({
    to: ['team@company.com'],
    subject: \`Daily Summary - \${new Date().toLocaleDateString()}\`,
    body: summary
  });
}

// Run daily at 9 AM
const now = new Date();
const scheduledTime = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  9, 0, 0 // 9:00 AM
);

if (now > scheduledTime) {
  scheduledTime.setDate(scheduledTime.getDate() + 1);
}

const timeUntilRun = scheduledTime - now;
setTimeout(() => {
  sendDailySummary();
  setInterval(sendDailySummary, 24 * 60 * 60 * 1000); // Every 24 hours
}, timeUntilRun);
```

### Use Case 2: Alert System

Monitor data and send alerts when thresholds are exceeded:

```javascript
async function checkAndAlert() {
  const workbook = XLSX.readFile('Metrics.xlsx');
  const data = XLSX.utils.sheet_to_json(workbook.Sheets['Live']);

  const alerts = data.filter(row => row.value > row.threshold);

  if (alerts.length > 0) {
    const alertBody = \`
⚠️ ALERT: Threshold Exceeded

The following metrics have exceeded their thresholds:

\${alerts.map(a => \`- \${a.metric}: \${a.value} (threshold: \${a.threshold})\`).join('\\n')}
\`;

    const client = await GmailClient.create();
    await client.sendMessage({
      to: ['alerts@company.com'],
      subject: '⚠️ Alert: Threshold Exceeded',
      body: alertBody
    });
  }
}

// Check every 5 minutes
setInterval(checkAndAlert, 5 * 60 * 1000);
```

### Use Case 3: Multi-Recipient Campaign

Send personalized emails to multiple recipients:

```javascript
async function sendCampaign() {
  const workbook = XLSX.readFile('Recipients.xlsx');
  const recipients = XLSX.utils.sheet_to_json(workbook.Sheets['Contacts']);

  const client = await GmailClient.create();

  for (const recipient of recipients) {
    const personalizedBody = \`
Hello \${recipient.name},

Your account status: \${recipient.status}
Current balance: $\${recipient.balance}

...\`;

    await client.sendMessage({
      to: [recipient.email],
      subject: \`Account Update for \${recipient.name}\`,
      body: personalizedBody
    });

    console.log(\`✓ Sent to \${recipient.email}\`);

    // Wait 1 second between emails to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

## 9. Troubleshooting

### Problem: "No client_secret_*.json file found"

**Solution:**
1. Verify the OAuth credentials file is in the correct directory
2. Check the filename starts with `client_secret_` and ends with `.json`
3. Ensure you're running the script from the correct directory

### Problem: "No token found. Please run authentication first"

**Solution:**
1. Run the authentication script: `node authenticate.js`
2. Complete the OAuth flow in your browser
3. Verify `token.json` was created

### Problem: MCP server not appearing in Claude Code

**Solution:**
1. Check `.claude.json` has correct configuration
2. Verify the `cwd` path points to the Gmail directory
3. Restart Claude Code completely
4. Check for syntax errors in `.claude.json` (valid JSON)

### Problem: "Error: invalid_grant" during authentication

**Solution:**
1. Delete `token.json`
2. Run authentication again: `node authenticate.js`
3. Make sure you're using the same Google account

### Problem: Gmail API quota exceeded

**Solution:**
1. Gmail API has sending limits (typically 100-500 emails/day for new accounts)
2. Check your quota at: https://console.cloud.google.com/apis/api/gmail.googleapis.com/quotas
3. Request quota increase if needed
4. Reduce email frequency

### Problem: Emails going to spam

**Solution:**
1. Send from your own email address to yourself (less likely to be spam)
2. Avoid spam trigger words in subject/body
3. Don't send too many emails too quickly
4. Consider using Gmail's "Send as" feature with proper SPF/DKIM setup

---

## 10. Security Best Practices

### Protecting Credentials

1. **Never commit credentials to version control:**
   - Add to `.gitignore`:
     ```
     client_secret_*.json
     token.json
     ```

2. **Restrict file permissions:**
   ```bash
   chmod 600 client_secret_*.json token.json
   ```

3. **Use environment variables for sensitive data:**
   ```javascript
   const recipientEmail = process.env.RECIPIENT_EMAIL || 'default@example.com';
   ```

### OAuth Token Management

1. **Tokens expire:** The Gmail MCP server automatically refreshes tokens
2. **Revoke access** if compromised:
   - Go to: https://myaccount.google.com/permissions
   - Find your app and click "Remove Access"

### Rate Limiting

1. **Implement delays between emails:**
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
   ```

2. **Monitor API usage:**
   - Check quotas regularly at Google Cloud Console
   - Implement retry logic with exponential backoff

### Email Content Safety

1. **Sanitize user input** if using dynamic content
2. **Validate email addresses** before sending
3. **Keep audit logs** of sent emails

---

## Appendix A: Complete File Structure

Your Gmail MCP directory should look like this:

```
gmail/
├── client_secret_XXXXX.json     # OAuth credentials (DO NOT COMMIT)
├── token.json                    # OAuth token (DO NOT COMMIT)
├── authenticate.js               # Authentication script
├── package.json                  # Node.js dependencies
├── package-lock.json            # Lock file
├── node_modules/                # Installed packages
├── dist/
│   ├── index.js                 # MCP server entry point
│   └── gmail.js                 # Gmail client helper
├── send-test-email.js           # Test script
├── send-email-every-minute.js   # 1-minute automation
├── send-strategy-email.js       # Single strategy email
├── send-strategy-every-3hours.js # 3-hour automation
├── AgentInput.xlsx              # Your data file
└── SETUP_MANUAL.md              # This manual
```

---

## Appendix B: Useful Commands Cheat Sheet

```bash
# Check Node.js version
node --version

# Install dependencies
npm install

# Run authentication
node authenticate.js

# Send test email
node send-test-email.js

# Run automation in background (Linux/Mac)
nohup node send-strategy-every-3hours.js > email.log 2>&1 &

# View running Node processes
ps aux | grep node

# Stop a process
kill [PID]

# View background logs
tail -f email.log

# Check Claude Code MCP status
/mcp

# Restart Claude Code
/exit
```

---

## Appendix C: Common Email Intervals

```javascript
// Intervals in milliseconds
const INTERVALS = {
  EVERY_MINUTE: 60 * 1000,
  EVERY_5_MINUTES: 5 * 60 * 1000,
  EVERY_15_MINUTES: 15 * 60 * 1000,
  EVERY_HOUR: 60 * 60 * 1000,
  EVERY_3_HOURS: 3 * 60 * 60 * 1000,
  EVERY_DAY: 24 * 60 * 60 * 1000,
  EVERY_WEEK: 7 * 24 * 60 * 60 * 1000
};

// Usage:
setInterval(sendEmail, INTERVALS.EVERY_3_HOURS);
```

---

## Support and Resources

- **Claude Code Documentation:** https://docs.claude.com/en/docs/claude-code
- **Gmail API Documentation:** https://developers.google.com/gmail/api
- **Google Cloud Console:** https://console.cloud.google.com
- **MCP Protocol:** https://modelcontextprotocol.io

---

**End of Manual**

For questions or issues, please refer to the troubleshooting section or consult the official documentation.
