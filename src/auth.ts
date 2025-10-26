/**
 * OAuth 2.0 authentication for Gmail API
 * Supports both local file-based auth (development) and Google Cloud Secret Manager (production)
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';
import * as http from 'http';
import { URL } from 'url';
import * as path from 'path';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.readonly'
];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// Cloud mode detection
const IS_CLOUD_MODE = process.env.GCP_PROJECT_ID !== undefined;

/**
 * Get secret from Google Cloud Secret Manager
 */
async function getSecretFromCloud(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();
  const projectId = process.env.GCP_PROJECT_ID;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret ${secretName} is empty`);
    }
    return payload;
  } catch (error) {
    throw new Error(`Failed to access secret ${secretName}: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Load OAuth2 credentials from file (local mode) or Secret Manager (cloud mode)
 */
export async function loadCredentials(): Promise<any> {
  if (IS_CLOUD_MODE) {
    console.log('🔐 Loading credentials from Secret Manager...');
    const content = await getSecretFromCloud('gmail-client-secret');
    return JSON.parse(content);
  }

  // Local mode - read from file
  const files = await fs.readdir(process.cwd());
  const credFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));

  if (!credFile) {
    throw new Error('No client_secret_*.json file found. Please download OAuth credentials from Google Cloud Console.');
  }

  const content = await fs.readFile(path.join(process.cwd(), credFile), 'utf-8');
  return JSON.parse(content);
}

/**
 * Create OAuth2 client
 */
export async function createOAuth2Client(): Promise<OAuth2Client> {
  const credentials = await loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}

/**
 * Get authenticated OAuth2 client
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const oauth2Client = await createOAuth2Client();

  try {
    let tokenJson: string;

    if (IS_CLOUD_MODE) {
      console.log('🔐 Loading OAuth token from Secret Manager...');
      tokenJson = await getSecretFromCloud('gmail-oauth-token');
    } else {
      // Local mode - read from file
      tokenJson = await fs.readFile(TOKEN_PATH, 'utf-8');
    }

    oauth2Client.setCredentials(JSON.parse(tokenJson));
    return oauth2Client;
  } catch (error) {
    throw new Error(
      IS_CLOUD_MODE
        ? 'No token found in Secret Manager. Please ensure gmail-oauth-token secret exists.'
        : 'No token found. Please run authentication first using the standalone auth script.'
    );
  }
}

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthUrl(oauth2Client: OAuth2Client): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokenFromCode(
  oauth2Client: OAuth2Client,
  code: string
): Promise<any> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Save token to file
 */
export async function saveToken(token: any): Promise<void> {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2));

  // Set restrictive permissions on Unix-like systems
  try {
    await fs.chmod(TOKEN_PATH, 0o600);
  } catch (error) {
    // Windows doesn't support chmod in the same way, ignore error
  }
}

/**
 * Standalone authentication flow
 * This should be run separately before starting the MCP server
 */
export async function authenticate(): Promise<void> {
  const oauth2Client = await createOAuth2Client();
  const authUrl = getAuthUrl(oauth2Client);

  console.log('Authorize this app by visiting this url:', authUrl);
  console.log('\nWaiting for authorization...\n');

  // Create a local server to receive the OAuth callback
  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/?code=')) {
      const url = new URL(req.url, 'http://localhost');
      const code = url.searchParams.get('code');

      if (code) {
        try {
          const tokens = await getTokenFromCode(oauth2Client, code);
          await saveToken(tokens);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication successful!</h1><p>You can close this window and return to the terminal.</p>');

          console.log('✓ Authentication successful!');
          console.log('Token saved to:', TOKEN_PATH);

          // Close server after a short delay
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 1000);
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed!</h1><p>Error: ' + error + '</p>');
          console.error('Error getting token:', error);
          server.close();
          process.exit(1);
        }
      }
    }
  });

  server.listen(3000, () => {
    console.log('Listening on http://localhost:3000');
    console.log('Please complete the authorization in your browser...\n');
  });
}

// Run authentication if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  authenticate().catch(console.error);
}
