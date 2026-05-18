# Vehicle Maintenance Scheduler Microservice

This microservice fetches depots and vehicles from the evaluation server and computes a schedule per depot that maximizes total impact within available mechanic-hours (0/1 knapsack).

Setup

1. Copy this repo or navigate to `vehicle_maintenance_scheduler`:

```powershell
cd c:\Users\Admin\Desktop\23CSR183\vehicle_maintenance_scheduler
npm install
```

2. Configure environment variables (create `.env` in the folder):

```
# API base (optional, defaults to the assignment endpoint)
EVAL_API_BASE=http://4.224.186.213/evaluation-service
# auth token for protected endpoints
EVAL_API_TOKEN=your_access_token_here
# optional: also used by logging middleware if present
LOG_AUTH_TOKEN=your_access_token_here
```

Run

```powershell
npm start
```

Open http://localhost:3001/schedule to run the scheduler and get JSON results.

Notes

- The scheduler attempts to group vehicles by depot using common field names (`DepotID`, `DepotId`, `depotId`, etc.). If vehicles do not include depot identifiers, the service schedules the same global vehicle list independently for each depot's mechanic-hours.
- The service will attempt to call the local `logging_middleware` if present at `../logging_middleware/src/index.js` to record an informational log.
- The scheduling algorithm is a standard 0/1 knapsack dynamic programming solution (optimal for integer durations and impacts).

Response

The `/schedule` endpoint returns JSON:

```json
{
  "schedules": [
    {
      "depotID": "1",
      "capacity": 60,
      "selectedCount": 5,
      "totalImpact": 42,
      "totalDuration": 60,
      "tasks": [ { "TaskID": "...", "Duration": 5, "Impact": 10 }, ... ]
    }
  ]
}
```

If you want, I can also add an endpoint that returns a CSV or screenshots-ready output for submission.
