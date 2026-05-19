/*  POST /api/generate
    Accepts { hex: "#RRGGBB", font?: { sans, mono, cssVar, monoVar } }
    Returns the full design-system token set.
    Rate-limited: 30 requests / 60 s per IP. */

"use strict";

var engine    = require("./_engine");
var ratelimit = require("./_ratelimit");

var CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

module.exports = function handler(req, res) {

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== "POST") {
    res.writeHead(405, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Rate limit
  var ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  var limit = ratelimit.check(ip, "generate", 30, 60000);

  if (!limit.allowed) {
    res.writeHead(429, Object.assign({}, CORS_HEADERS, {
      "Retry-After": Math.ceil(limit.retryAfterMs / 1000).toString()
    }));
    return res.end(JSON.stringify({
      error: "Rate limit exceeded",
      retryAfterMs: limit.retryAfterMs
    }));
  }

  // Parse body (Vercel automatically parses JSON bodies)
  var body = req.body;

  if (!body || !body.hex) {
    res.writeHead(400, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Missing required field: hex" }));
  }

  var hex = body.hex.trim();

  // Normalize — accept "E8B26B" or "#E8B26B"
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    hex = "#" + hex;
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    res.writeHead(400, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Invalid hex color. Expected format: #RRGGBB" }));
  }

  try {
    var tokens = engine.generate(hex, body.font || null);

    res.writeHead(200, Object.assign({}, CORS_HEADERS, {
      "X-RateLimit-Remaining": limit.remaining.toString(),
      "Cache-Control": "public, max-age=86400, s-maxage=86400"
    }));
    return res.end(JSON.stringify(tokens));

  } catch (err) {
    res.writeHead(500, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Generation failed: " + err.message }));
  }
};
