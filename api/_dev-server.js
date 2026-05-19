/*  Local dev server for API endpoints.
    Run: node api/_dev-server.js
    Mirrors how Vercel routes /api/* to handler functions. */

"use strict";

var http = require("http");
var generateHandler = require("./generate");
var exportHandler   = require("./export");

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
  parseBody(req, function() {
    if (req.url === "/api/generate" || req.url === "/api/generate/") {
      return generateHandler(req, res);
    }
    if (req.url === "/api/export" || req.url === "/api/export/") {
      return exportHandler(req, res);
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
});

server.listen(PORT, function() {
  console.log("API dev server running on http://localhost:" + PORT);
  console.log("  POST /api/generate");
  console.log("  POST /api/export");
});
