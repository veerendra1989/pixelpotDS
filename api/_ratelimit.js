/*  hextodesign — IP-based sliding-window rate limiter (serverless)
    Uses an in-memory Map.  Each Vercel function instance gets its own map;
    this is fine — it still prevents single-IP burst abuse within one
    warm instance, and Vercel's own DDoS layer handles the rest.
    ⚠ Server-only — never import from client code. */

"use strict";

var windows = {};          // { bucketKey: { timestamps: [], lastClean: ms } }
var CLEAN_INTERVAL = 60000; // purge stale entries every 60 s

/**
 * @param {string} ip
 * @param {string} action    — e.g. "generate" or "export"
 * @param {number} maxReqs   — allowed requests in the window
 * @param {number} windowMs  — window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number|null }}
 */
function check(ip, action, maxReqs, windowMs) {
  var key = action + ":" + ip;
  var now = Date.now();

  if (!windows[key]) {
    windows[key] = { timestamps: [], lastClean: now };
  }

  var bucket = windows[key];

  // Purge expired entries
  if (now - bucket.lastClean > CLEAN_INTERVAL) {
    bucket.timestamps = bucket.timestamps.filter(function(t) { return t > now - windowMs; });
    bucket.lastClean = now;
  }

  // Slide: keep only timestamps inside the current window
  var cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter(function(t) { return t > cutoff; });

  if (bucket.timestamps.length >= maxReqs) {
    var oldest = bucket.timestamps[0];
    var retryAfterMs = oldest + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000)
    };
  }

  bucket.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxReqs - bucket.timestamps.length,
    retryAfterMs: null
  };
}

/** Periodically clean up IPs that haven't been seen in 5 minutes */
function cleanup() {
  var now = Date.now();
  var keys = Object.keys(windows);
  for (var i = 0; i < keys.length; i++) {
    var bucket = windows[keys[i]];
    if (bucket.timestamps.length === 0 || (now - bucket.timestamps[bucket.timestamps.length - 1]) > 300000) {
      delete windows[keys[i]];
    }
  }
}

setInterval(cleanup, 120000);

module.exports = { check: check };
