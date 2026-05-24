/*  Local dev server for API endpoints.
    Run: node api/_dev-server.js
    Mirrors how Vercel routes /api/* to handler functions. */

"use strict";

var http = require("http");
var url  = require("url");
var generateHandler = require("./generate");
var exportHandler   = require("./export");
var trackHandler    = require("./track");
var analyticsHandler = require("./analytics");

var PORT = 3001;

function parseBody(req, callback) {
  var body = "";
  req.on("data", function(chunk) { body += chunk; });
  req.on("end", function() {
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch(e) {
      req.body = {};
    }
    callback();
  });
}

var server = http.createServer(function(req, res) {
  // Parse query params
  var parsed = url.parse(req.url, true);
  req.query = parsed.query;
  var pathname = parsed.pathname;

  // CORS headers for all API routes
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  parseBody(req, function() {
    if (pathname === "/api/generate" || pathname === "/api/generate/") {
      return generateHandler(req, res);
    }
    if (pathname === "/api/export" || pathname === "/api/export/") {
      return exportHandler(req, res);
    }
    if (pathname === "/api/track" || pathname === "/api/track/") {
      return trackHandler(req, res);
    }
    if (pathname === "/api/analytics" || pathname === "/api/analytics/") {
      return analyticsHandler(req, res);
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
});

server.listen(PORT, function() {
  console.log("API dev server running on http://localhost:" + PORT);
  console.log("  POST /api/generate");
  console.log("  POST /api/export");
  console.log("  POST /api/track");
  console.log("  GET  /api/analytics");
});
