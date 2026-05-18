# logging_middleware

Reusable backend logging middleware that sends structured logs to the evaluation server.

## Install

```bash
cd logging_middleware
npm install
```

## Usage

```js
const Log = require('./src');

await Log('backend', 'info', 'handler', 'User profile loaded successfully');
```

## API

`Log(stack, level, package, message)`

Allowed values:

- `stack`: `backend`, `frontend`
- `level`: `debug`, `info`, `warn`, `error`, `fatal`
- `package` for backend: `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`
- `package` for frontend: `api`, `component`, `hook`, `page`, `state`, `style`
- shared packages: `auth`, `config`, `middleware`, `utils`

## Environment

- `LOG_AUTH_TOKEN`, `AUTH_TOKEN`, or `TOKEN` can be used for the protected log API.
- PowerShell example:

```powershell
$env:LOG_AUTH_TOKEN="your_token_here"
npm run demo
```
