import { authenticate } from './dist/auth.js';

console.log('Starting manual authentication...\n');

authenticate().catch(error => {
  console.error('Authentication failed:', error);
  process.exit(1);
});
