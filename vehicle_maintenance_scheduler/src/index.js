require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { scheduleAll } = require('./scheduler');
const Log = (() => {
  try {
    return require('../../logging_middleware/src/index.js');
  } catch (e) {
    return null;
  }
})();

const app = express();
app.use(bodyParser.json());

const API_BASE = process.env.EVAL_API_BASE || 'http://4.224.186.213/evaluation-service';
const TOKEN = process.env.LOG_AUTH_TOKEN || process.env.AUTH_TOKEN || process.env.TOKEN || process.env.EVAL_API_TOKEN;

app.get('/schedule', async (req, res) => {
  try {
    const schedules = await scheduleAll(API_BASE, TOKEN);

    if (Log) {
      try {
        Log('backend', 'info', 'service', `Generated schedules for ${schedules.length} depots`);
      } catch (e) {
        // ignore logging errors
      }
    }

    res.json({ schedules });
  } catch (err) {
    if (Log) {
      try { Log('backend', 'error', 'service', `Schedule generation failed: ${err.message}`); } catch (e) {}
    }
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`vehicle_maintenance_scheduler running on port ${PORT}`);
});
