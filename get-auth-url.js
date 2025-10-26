import { createOAuth2Client, getAuthUrl } from './dist/auth.js';

async function getUrl() {
  try {
    const oauth2Client = await createOAuth2Client();
    const authUrl = getAuthUrl(oauth2Client);
    console.log('\n=================================================================');
    console.log('AUTHORIZATION URL:');
    console.log('=================================================================\n');
    console.log(authUrl);
    console.log('\n=================================================================');
    console.log('Copy and paste this URL into your browser to authenticate');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getUrl();
