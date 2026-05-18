const fetch = require('node-fetch');

async function fetchJson(url, token) {
  const headers = { 'Content-Type': 'application/json' };
  console.log(`[DEBUG-fetchJson] URL: ${url}`);
  console.log(`[DEBUG-fetchJson] Token provided: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

function pickDepotField(vehicle) {
  // prefer commonly named depot id fields
  return vehicle.DepotID ?? vehicle.DepotId ?? vehicle.depotId ?? vehicle.depotID ?? vehicle.depot ?? null;
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

// 0/1 knapsack DP returning chosen items maximizing total impact under capacity
function knapsack(items, capacity) {
  const n = items.length;
  const cap = Math.max(0, Math.floor(capacity));

  // dp[w] = max impact for capacity w
  const dp = new Array(cap + 1).fill(0);
  // keep track of picks: picks[w] = bitset or array of indices chosen for dp[w]
  const picks = new Array(cap + 1).fill(null).map(() => []);

  for (let i = 0; i < n; i++) {
    const wt = toInt(items[i].Duration);
    const val = toInt(items[i].Impact);
    if (wt <= 0) continue;
    for (let w = cap; w >= wt; w--) {
      const candidate = dp[w - wt] + val;
      if (candidate > dp[w]) {
        dp[w] = candidate;
        picks[w] = picks[w - wt].concat(i);
      }
    }
  }

  // find best w
  let bestW = 0;
  for (let w = 0; w <= cap; w++) {
    if (dp[w] > dp[bestW]) bestW = w;
  }

  const chosenIndices = picks[bestW];
  const chosen = chosenIndices.map(i => items[i]);
  const totalImpact = chosen.reduce((s, it) => s + toInt(it.Impact), 0);
  const totalDuration = chosen.reduce((s, it) => s + toInt(it.Duration), 0);

  return { chosen, totalImpact, totalDuration };
}

async function scheduleAll(apiBase, token) {
  if (!apiBase) throw new Error('apiBase is required');
  console.log(`[DEBUG-scheduleAll] apiBase: ${apiBase}`);
  console.log(`[DEBUG-scheduleAll] token received: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);

  const depotsUrl = `${apiBase.replace(/\/$/, '')}/depots`;
  const vehiclesUrl = `${apiBase.replace(/\/$/, '')}/vehicles`;

  const depotsResp = await fetchJson(depotsUrl, token);
  const vehiclesResp = await fetchJson(vehiclesUrl, token);

  const depots = depotsResp.depots ?? depotsResp;
  const vehicles = vehiclesResp.vehicles ?? vehiclesResp;

  // If vehicles lack any depot field, treat vehicles as global and schedule once for total mechanic hours
  const hasAnyDepotField = vehicles.some(v => pickDepotField(v) !== null);

  const results = [];

  if (!Array.isArray(depots)) throw new Error('Invalid depots response');
  if (!Array.isArray(vehicles)) throw new Error('Invalid vehicles response');

  if (!hasAnyDepotField) {
    // schedule globally for each depot independently using all vehicles
    for (const depot of depots) {
      const capacity = toInt(depot.MechanicHours ?? depot.mechanicHours ?? depot.MechanicHours ?? 0);
      const { chosen, totalImpact, totalDuration } = knapsack(vehicles, capacity);
      results.push({ depotID: depot.ID ?? depot.Id ?? depot.id, capacity, selectedCount: chosen.length, totalImpact, totalDuration, tasks: chosen });
    }
    return results;
  }

  // normal case - group vehicles by depot
  const vehiclesByDepot = new Map();
  for (const v of vehicles) {
    const d = pickDepotField(v);
    if (d == null) continue;
    const key = String(d);
    if (!vehiclesByDepot.has(key)) vehiclesByDepot.set(key, []);
    vehiclesByDepot.get(key).push(v);
  }

  for (const depot of depots) {
    const depotKey = String(depot.ID ?? depot.Id ?? depot.id);
    const capacity = toInt(depot.MechanicHours ?? depot.mechanicHours ?? 0);
    const items = vehiclesByDepot.get(depotKey) ?? [];
    const { chosen, totalImpact, totalDuration } = knapsack(items, capacity);

    results.push({ depotID: depotKey, capacity, selectedCount: chosen.length, totalImpact, totalDuration, tasks: chosen });
  }

  return results;
}

module.exports = { scheduleAll, knapsack };
