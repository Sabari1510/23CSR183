require('dotenv').config();
const fetch = require('node-fetch');

const ENDPOINT = 'http://4.224.186.213/evaluation-service/logs';

const VALID_STACKS = new Set(['backend', 'frontend']);
const VALID_LEVELS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
const VALID_PACKAGES = {
  backend: new Set(['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service']),
  frontend: new Set(['api', 'component', 'hook', 'page', 'state', 'style']),
  shared: new Set(['auth', 'config', 'middleware', 'utils'])
};

function isLowerCase(value) {
  return typeof value === 'string' && value === value.toLowerCase();
}

function validateField(name, value, allowedValues) {
  if (!isLowerCase(value)) {
    throw new Error(`${name} must be a lower-case string`);
  }

  if (!allowedValues.has(value)) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

function getAuthToken() {
  return process.env.LOG_AUTH_TOKEN || process.env.AUTH_TOKEN || process.env.TOKEN || '';
}

async function Log(stack, level, pkg, message) {
  validateField('stack', stack, VALID_STACKS);
  validateField('level', level, VALID_LEVELS);

  const allowedPackages = new Set([
    ...VALID_PACKAGES[stack],
    ...VALID_PACKAGES.shared
  ]);
  validateField('package', pkg, allowedPackages);

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
    },
    body: JSON.stringify({
      stack,
      level,
      package: pkg,
      message
    })
  });

  const responseText = await response.text();
  let body = responseText;

  try {
    body = responseText ? JSON.parse(responseText) : responseText;
  } catch (error) {
    body = responseText;
  }

  return {
    status: response.status,
    ok: response.ok,
    body
  };
}

module.exports = Log;
module.exports.Log = Log;
