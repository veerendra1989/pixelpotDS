/*  hextodesign — Analytics Data Retrieval Endpoint
    Returns aggregated analytics data for the admin dashboard.
    Protected by ANALYTICS_SECRET env var.

    Required env vars:
      UPSTASH_REDIS_REST_URL
      UPSTASH_REDIS_REST_TOKEN
      ANALYTICS_SECRET — shared secret for dashboard access
*/

"use strict";

var REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
var REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
var SECRET = process.env.ANALYTICS_SECRET;

async function redis(command) {
  var res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + REDIS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error("Redis error: " + res.status);
  var data = await res.json();
  return data.result;
}

async function redisPipeline(commands) {
  var res = await fetch(REDIS_URL + "/pipeline", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + REDIS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error("Redis pipeline error: " + res.status);
  var data = await res.json();
  return data.map(function (r) { return r.result; });
}

/** Generate array of date strings between start and end (inclusive) */
function dateRange(startStr, endStr) {
  var dates = [];
  var current = new Date(startStr + "T00:00:00Z");
  var end = new Date(endStr + "T00:00:00Z");
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/** Today's date string */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/** N days ago */
function daysAgo(n) {
  var d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Auth check
  if (!SECRET) return res.status(500).json({ error: "ANALYTICS_SECRET not configured" });

  var authHeader = req.headers.authorization || "";
  var token = authHeader.replace("Bearer ", "");
  if (token !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({ error: "Redis not configured" });
  }

  try {
    // Parse query params
    var query = req.query || {};
    var days = Math.min(parseInt(query.days) || 30, 90);
    var startDate = query.start || daysAgo(days - 1);
    var endDate = query.end || today();
    var dates = dateRange(startDate, endDate);

    // Build pipeline: fetch daily stats for each date + totals + top colors
    var commands = [];

    // Daily event counts for the range
    for (var i = 0; i < dates.length; i++) {
      commands.push(["HGETALL", "stats:daily:" + dates[i]]);
    }
    var dailyEnd = commands.length;

    // All-time totals
    commands.push(["HGETALL", "stats:totals"]);

    // Top colors (top 20)
    commands.push(["ZREVRANGE", "stats:colors:popular", 0, 19, "WITHSCORES"]);

    // Top fonts (top 10)
    commands.push(["ZREVRANGE", "stats:fonts:popular", 0, 9, "WITHSCORES"]);

    // Export format breakdown (all time)
    commands.push(["HGETALL", "stats:exports:all"]);

    // Export type breakdown (individual vs zip)
    commands.push(["HGETALL", "stats:export_type:all"]);

    // Page views breakdown (all time)
    commands.push(["HGETALL", "stats:pages:all"]);

    // Device breakdown
    commands.push(["HGETALL", "stats:devices"]);

    // Copy format breakdown
    commands.push(["HGETALL", "stats:copies:all"]);

    // Plans breakdown
    commands.push(["HGETALL", "stats:plans"]);

    var results = await redisPipeline(commands);

    // Parse daily data
    var daily = [];
    for (var d = 0; d < dates.length; d++) {
      var raw = results[d] || {};
      // HGETALL returns flat array: [key, val, key, val, ...]
      var parsed = {};
      if (Array.isArray(raw)) {
        for (var j = 0; j < raw.length; j += 2) {
          parsed[raw[j]] = parseInt(raw[j + 1]) || 0;
        }
      } else if (typeof raw === "object") {
        // Some Redis clients return objects directly
        parsed = raw;
      }
      daily.push({
        date: dates[d],
        page_view: parseInt(parsed.page_view) || 0,
        generate: parseInt(parsed.generate) || 0,
        export: parseInt(parsed.export) || 0,
        copy: parseInt(parsed.copy) || 0,
        cta_click: parseInt(parsed.cta_click) || 0,
      });
    }

    // Parse totals
    var totalsRaw = results[dailyEnd] || {};
    var totals = {};
    if (Array.isArray(totalsRaw)) {
      for (var t = 0; t < totalsRaw.length; t += 2) {
        totals[totalsRaw[t]] = parseInt(totalsRaw[t + 1]) || 0;
      }
    } else if (typeof totalsRaw === "object") {
      totals = totalsRaw;
    }

    // Parse sorted sets (colors, fonts) — returns [member, score, member, score, ...]
    function parseSortedSet(raw) {
      var items = [];
      if (Array.isArray(raw)) {
        for (var s = 0; s < raw.length; s += 2) {
          items.push({ value: raw[s], count: parseInt(raw[s + 1]) || 0 });
        }
      }
      return items;
    }

    // Parse hash (flat array to object)
    function parseHash(raw) {
      var obj = {};
      if (Array.isArray(raw)) {
        for (var h = 0; h < raw.length; h += 2) {
          obj[raw[h]] = parseInt(raw[h + 1]) || 0;
        }
      } else if (typeof raw === "object" && raw !== null) {
        Object.keys(raw).forEach(function (k) { obj[k] = parseInt(raw[k]) || 0; });
      }
      return obj;
    }

    var topColors = parseSortedSet(results[dailyEnd + 1]);
    var topFonts = parseSortedSet(results[dailyEnd + 2]);
    var exports_ = parseHash(results[dailyEnd + 3]);
    var exportTypes = parseHash(results[dailyEnd + 4]);
    var pages = parseHash(results[dailyEnd + 5]);
    var devices = parseHash(results[dailyEnd + 6]);
    var copies = parseHash(results[dailyEnd + 7]);
    var plans = parseHash(results[dailyEnd + 8]);

    // Compute summary for the selected range
    var summary = { page_view: 0, generate: 0, export: 0, copy: 0 };
    for (var s = 0; s < daily.length; s++) {
      summary.page_view += daily[s].page_view;
      summary.generate += daily[s].generate;
      summary.export += daily[s].export;
      summary.copy += daily[s].copy;
    }

    return res.status(200).json({
      range: { start: startDate, end: endDate, days: dates.length },
      summary: summary,
      totals: totals,
      daily: daily,
      topColors: topColors,
      topFonts: topFonts,
      exports: exports_,
      exportTypes: exportTypes,
      pages: pages,
      devices: devices,
      copies: copies,
      plans: plans,
    });
  } catch (err) {
    console.error("[analytics]", err.message);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
