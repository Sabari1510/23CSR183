require('dotenv').config();
const { Log } = require('./index');

const authToken = process.env.LOG_AUTH_TOKEN || process.env.AUTH_TOKEN || process.env.TOKEN;

(async function run() {
  try {
    if (!authToken) {
      console.error('No auth token found. Set LOG_AUTH_TOKEN, AUTH_TOKEN, or TOKEN before running the demo.');
      console.error('PowerShell example: $env:LOG_AUTH_TOKEN="your_token_here"; npm run demo');
      process.exitCode = 1;
      return;
    }

    const result = await Log('backend', 'info', 'handler', 'Example log sent from backend middleware');
    console.log('Log sent:', result);
  } catch (error) {
    console.error('Failed to send log:', error.message);
    process.exitCode = 1;
  }
})();
