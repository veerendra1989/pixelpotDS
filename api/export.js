/*  POST /api/export
    Accepts { hex, format, tier?, font? }
    Returns the formatted design-system file content.
    Tier-gated: free = rejected, starter = CSS+JSON, pro = +Tailwind+SCSS, studio = all.
    Rate-limited: 10 requests / 60 s per IP. */

"use strict";

var engine     = require("./_engine");
var ratelimit  = require("./_ratelimit");
var formatters = require("./_formatters");

var CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

/* Format → { fn, contentType, ext, minTier } */
var FORMAT_MAP = {
  css:      { fn: formatters.toCSSVariables,  contentType: "text/css",        ext: "css",   minTier: 1 },
  json:     { fn: formatters.toJSON,          contentType: "application/json", ext: "json",  minTier: 1 },
  tailwind: { fn: formatters.toTailwindConfig,contentType: "text/javascript", ext: "js",    minTier: 2 },
  scss:     { fn: formatters.toSCSS,          contentType: "text/x-scss",     ext: "scss",  minTier: 2 },
  figma:    { fn: formatters.toFigmaTokens,   contentType: "application/json", ext: "json",  minTier: 3 },
  docs:     { fn: formatters.toDocMarkdown,   contentType: "text/markdown",   ext: "md",    minTier: 3 }
};

/* Tier name → numeric level */
var TIER_LEVELS = {
  free: 0,
  starter: 1,
  pro: 2,
  studio: 3
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
  var limit = ratelimit.check(ip, "export", 10, 60000);

  if (!limit.allowed) {
    res.writeHead(429, Object.assign({}, CORS_HEADERS, {
      "Retry-After": Math.ceil(limit.retryAfterMs / 1000).toString()
    }));
    return res.end(JSON.stringify({
      error: "Rate limit exceeded",
      retryAfterMs: limit.retryAfterMs
    }));
  }

  var body = req.body;

  if (!body || !body.hex || !body.format) {
    res.writeHead(400, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Missing required fields: hex, format" }));
  }

  // Validate hex
  var hex = body.hex.trim();
  if (/^[0-9a-fA-F]{6}$/.test(hex)) hex = "#" + hex;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    res.writeHead(400, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Invalid hex color" }));
  }

  // Validate format
  var format = body.format.toLowerCase();
  var formatDef = FORMAT_MAP[format];
  if (!formatDef) {
    res.writeHead(400, CORS_HEADERS);
    return res.end(JSON.stringify({
      error: "Unknown format: " + format,
      available: Object.keys(FORMAT_MAP)
    }));
  }

  // Tier check
  var tier = (body.tier || "free").toLowerCase();
  var tierLevel = TIER_LEVELS[tier];
  if (tierLevel === undefined) tierLevel = 0;

  if (tierLevel < formatDef.minTier) {
    var tierNames = ["free", "starter", "pro", "studio"];
    res.writeHead(403, CORS_HEADERS);
    return res.end(JSON.stringify({
      error: "Format '" + format + "' requires " + tierNames[formatDef.minTier] + " tier or higher",
      currentTier: tier,
      requiredTier: tierNames[formatDef.minTier],
      upgrade: "https://hextodesign.com/#pricing"
    }));
  }

  try {
    var tokens = engine.generate(hex, body.font || null);
    var output = formatDef.fn(tokens);

    res.writeHead(200, Object.assign({}, CORS_HEADERS, {
      "Content-Type": formatDef.contentType,
      "Content-Disposition": "attachment; filename=\"design-tokens." + formatDef.ext + "\"",
      "X-RateLimit-Remaining": limit.remaining.toString()
    }));
    return res.end(output);

  } catch (err) {
    res.writeHead(500, CORS_HEADERS);
    return res.end(JSON.stringify({ error: "Export failed: " + err.message }));
  }
};
