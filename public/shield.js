/*  hextodesign — Client-side Code Protection Shield
    Prevents casual and intermediate code inspection/copying.
    Loaded before any application code. */

(function() {
  "use strict";

  // ─── 1. Disable right-click context menu ───
  document.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    return false;
  }, true);

  // ─── 2. Block DevTools & source-viewing keyboard shortcuts ───
  var blockedKeys = {
    // F12
    123: true
  };
  var blockedCombos = [
    // Ctrl+Shift+I (Inspect)
    { ctrl: true, shift: true, code: 73 },
    // Ctrl+Shift+J (Console)
    { ctrl: true, shift: true, code: 74 },
    // Ctrl+Shift+C (Element picker)
    { ctrl: true, shift: true, code: 67 },
    // Ctrl+U (View Source)
    { ctrl: true, shift: false, code: 85 },
    // Ctrl+S (Save page)
    { ctrl: true, shift: false, code: 83 },
    // Ctrl+P (Print)
    { ctrl: true, shift: false, code: 80 },
    // Ctrl+A (Select all — outside inputs)
    { ctrl: true, shift: false, code: 65 }
  ];

  document.addEventListener("keydown", function(e) {
    var k = e.keyCode || e.which;

    // F12
    if (blockedKeys[k]) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl/Cmd combos
    var ctrl = e.ctrlKey || e.metaKey;
    for (var i = 0; i < blockedCombos.length; i++) {
      var c = blockedCombos[i];
      if (ctrl && e.shiftKey === c.shift && k === c.code) {
        // Allow Ctrl+A only inside input/textarea/contenteditable
        if (k === 65 && !c.shift) {
          var tag = (e.target.tagName || "").toLowerCase();
          if (tag === "input" || tag === "textarea" || e.target.contentEditable === "true") {
            return true;
          }
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, true);

  // ─── 3. Disable text selection (except inputs) ───
  var style = document.createElement("style");
  style.textContent = [
    "*, *::before, *::after {",
    "  -webkit-user-select: none !important;",
    "  -moz-user-select: none !important;",
    "  -ms-user-select: none !important;",
    "  user-select: none !important;",
    "}",
    "input, textarea, [contenteditable='true'] {",
    "  -webkit-user-select: text !important;",
    "  -moz-user-select: text !important;",
    "  -ms-user-select: text !important;",
    "  user-select: text !important;",
    "}"
  ].join("\n");
  document.head.appendChild(style);

  // ─── 4. Disable copy / cut (except in inputs) ───
  document.addEventListener("copy", function(e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag !== "input" && tag !== "textarea") {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "");
      }
      return false;
    }
  }, true);

  document.addEventListener("cut", function(e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag !== "input" && tag !== "textarea") {
      e.preventDefault();
      return false;
    }
  }, true);

  // ─── 5. Disable drag ───
  document.addEventListener("dragstart", function(e) {
    e.preventDefault();
    return false;
  }, true);

  // ─── 6. Console warning & clearing ───
  var _cl = console.log;
  var _cw = console.warn;
  var _ce = console.error;

  function poisonConsole() {
    try {
      console.clear();
      _cw.call(console,
        "%c⚠ STOP",
        "color:#E8B26B;font-size:60px;font-weight:800;text-shadow:2px 2px 0 #000;"
      );
      _cw.call(console,
        "%cThis is a protected application. Inspecting, copying, or reverse-engineering the source code is prohibited.\n\n© 2026 hextodesign. All rights reserved.",
        "color:#c8c5bd;font-size:14px;line-height:1.6;"
      );
    } catch(_) {}
  }

  // Run immediately and on intervals
  poisonConsole();
  setInterval(poisonConsole, 3000);

  // ─── 7. DevTools detection ───
  var _dtOpen = false;
  var _blurApplied = false;

  // Method A: element-based detection (console.log trick)
  var _devCheckEl = new Image();
  Object.defineProperty(_devCheckEl, "id", {
    get: function() {
      _dtOpen = true;
    }
  });

  // Method B: window size detection (outer vs inner)
  // DevTools docked to side = large width diff; docked to bottom = large height diff
  // Use generous threshold to avoid false positives from browser chrome/toolbars
  function checkBySize() {
    if (window.outerWidth === 0 || window.outerHeight === 0) return;
    var wDiff = window.outerWidth - window.innerWidth;
    var hDiff = window.outerHeight - window.innerHeight;
    // Trigger only when diff exceeds 300px (DevTools panel is typically 300-600px)
    if (wDiff > 300 || hDiff > 300) {
      _dtOpen = true;
    }
  }

  // Periodic check — blur page when DevTools detected
  setInterval(function() {
    _dtOpen = false;
    checkBySize();

    var root = document.getElementById("root");
    if (!root) return;

    if (_dtOpen && !_blurApplied) {
      root.style.filter = "blur(20px)";
      root.style.pointerEvents = "none";
      _blurApplied = true;
    } else if (!_dtOpen && _blurApplied) {
      root.style.filter = "";
      root.style.pointerEvents = "";
      _blurApplied = false;
    }
  }, 2000);

  // ─── 8. Prevent iframe embedding (clickjacking) ───
  if (window.self !== window.top) {
    try {
      window.top.location = window.self.location;
    } catch(e) {
      // blocked by CSP — hide content
      document.documentElement.style.display = "none";
    }
  }

  // ─── 9. Disable console methods overwriting ───
  try {
    Object.defineProperty(window, "console", {
      get: function() {
        return {
          log: function() {},
          warn: function() {},
          error: function() {},
          info: function() {},
          debug: function() {},
          dir: function() {},
          dirxml: function() {},
          table: function() {},
          trace: function() {},
          assert: function() {},
          count: function() {},
          clear: function() {},
          group: function() {},
          groupEnd: function() {},
          time: function() {},
          timeEnd: function() {},
          profile: function() {},
          profileEnd: function() {}
        };
      },
      set: function() {}
    });
  } catch(_) {
    // Some environments don't allow redefining console
  }

  // ─── 10. Protect global objects from extraction ───
  // Freeze key objects after page load
  window.addEventListener("load", function() {
    setTimeout(function() {
      try {
        // Protect PPColorUtils (lightweight color math — no generation logic)
        if (window.PPColorUtils) {
          Object.defineProperty(window, "PPColorUtils", {
            value: window.PPColorUtils,
            writable: false,
            enumerable: false,
            configurable: false
          });
        }

        // Protect other globals
        ["PP", "PPTop", "PPMid", "PPGallery", "PPGen", "PPBot"].forEach(function(name) {
          if (window[name]) {
            Object.defineProperty(window, name, {
              value: window[name],
              writable: false,
              enumerable: false,
              configurable: false
            });
          }
        });
      } catch(_) {}
    }, 2000);
  });

  // ─── 11. Prevent page save via beforeprint ───
  window.addEventListener("beforeprint", function(e) {
    var root = document.getElementById("root");
    if (root) root.style.display = "none";
  });
  window.addEventListener("afterprint", function(e) {
    var root = document.getElementById("root");
    if (root) root.style.display = "";
  });

})();
