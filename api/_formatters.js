/*  hextodesign — Export formatters
    Converts a token set (from _engine.generate) into various output formats.
    ⚠ Server-only — never import from client code. */

"use strict";

/* ── CSS Variables ── */

function toCSSVariables(tokens) {
  var lines = [];
  lines.push("/* hextodesign — Design System Tokens */");
  lines.push("/* Generated " + tokens.meta.created + " from " + tokens.meta.source + " */");
  lines.push("");
  lines.push(":root {");

  // Brand palette
  lines.push("  /* Brand */");
  var brandKeys = Object.keys(tokens.color.brand);
  for (var i = 0; i < brandKeys.length; i++) {
    var stop = brandKeys[i];
    lines.push("  --brand-" + stop + ": " + tokens.color.brand[stop].hex + ";");
  }

  // Semantic colors
  lines.push("");
  lines.push("  /* Semantic */");
  var semKeys = Object.keys(tokens.color.semantic);
  for (var j = 0; j < semKeys.length; j++) {
    var key = semKeys[j];
    var sem = tokens.color.semantic[key];
    lines.push("  --" + key + ": " + sem.base + ";");
    lines.push("  --" + key + "-light: " + sem.light + ";");
    lines.push("  --" + key + "-dark: " + sem.dark + ";");
  }

  // Light surfaces
  lines.push("");
  lines.push("  /* Surfaces — Light */");
  var lightKeys = Object.keys(tokens.color.surface.light);
  for (var k = 0; k < lightKeys.length; k++) {
    lines.push("  --surface-" + lightKeys[k] + ": " + tokens.color.surface.light[lightKeys[k]] + ";");
  }

  // Typography
  lines.push("");
  lines.push("  /* Typography */");
  lines.push("  --font-sans: " + tokens.typography.families.cssVar + ";");
  lines.push("  --font-mono: " + tokens.typography.families.monoVar + ";");
  var scaleKeys = Object.keys(tokens.typography.scale);
  for (var m = 0; m < scaleKeys.length; m++) {
    var name = scaleKeys[m];
    var s = tokens.typography.scale[name];
    lines.push("  --text-" + name + ": " + s.size + "px;");
  }

  // Spacing
  lines.push("");
  lines.push("  /* Spacing */");
  var spKeys = Object.keys(tokens.spacing.tokens);
  for (var n = 0; n < spKeys.length; n++) {
    var spName = spKeys[n].toString().replace(".", "_");
    lines.push("  --space-" + spName + ": " + tokens.spacing.tokens[spKeys[n]] + ";");
  }

  // Radius
  lines.push("");
  lines.push("  /* Radius */");
  var radKeys = Object.keys(tokens.radius);
  for (var p = 0; p < radKeys.length; p++) {
    lines.push("  --radius-" + radKeys[p] + ": " + tokens.radius[radKeys[p]] + ";");
  }

  // Shadows
  lines.push("");
  lines.push("  /* Shadows */");
  var shadKeys = Object.keys(tokens.shadow);
  for (var q = 0; q < shadKeys.length; q++) {
    lines.push("  --shadow-" + shadKeys[q] + ": " + tokens.shadow[shadKeys[q]] + ";");
  }

  lines.push("}");

  // Dark theme
  lines.push("");
  lines.push("[data-theme=\"dark\"] {");
  var darkKeys = Object.keys(tokens.color.surface.dark);
  for (var r = 0; r < darkKeys.length; r++) {
    lines.push("  --surface-" + darkKeys[r] + ": " + tokens.color.surface.dark[darkKeys[r]] + ";");
  }
  lines.push("}");

  return lines.join("\n");
}

/* ── JSON Tokens ── */

function toJSON(tokens) {
  return JSON.stringify(tokens, null, 2);
}

/* ── Tailwind Config ── */

function toTailwindConfig(tokens) {
  var lines = [];
  lines.push("/** hextodesign — Tailwind CSS Config */");
  lines.push("/** Generated " + tokens.meta.created + " from " + tokens.meta.source + " */");
  lines.push("");
  lines.push("module.exports = {");
  lines.push("  theme: {");
  lines.push("    extend: {");

  // Colors
  lines.push("      colors: {");
  lines.push("        brand: {");
  var brandKeys = Object.keys(tokens.color.brand);
  for (var i = 0; i < brandKeys.length; i++) {
    var comma = i < brandKeys.length - 1 ? "," : "";
    lines.push("          " + brandKeys[i] + ": \"" + tokens.color.brand[brandKeys[i]].hex + "\"" + comma);
  }
  lines.push("        },");

  // Semantic
  var semKeys = Object.keys(tokens.color.semantic);
  for (var j = 0; j < semKeys.length; j++) {
    var key = semKeys[j];
    var sem = tokens.color.semantic[key];
    var semComma = j < semKeys.length - 1 ? "," : "";
    lines.push("        " + key + ": {");
    lines.push("          DEFAULT: \"" + sem.base + "\",");
    lines.push("          light: \"" + sem.light + "\",");
    lines.push("          dark: \"" + sem.dark + "\"");
    lines.push("        }" + semComma);
  }
  lines.push("      },");

  // Font families
  lines.push("      fontFamily: {");
  lines.push("        sans: [" + tokens.typography.families.cssVar.split(",").map(function(f) { return "\"" + f.trim().replace(/"/g, "") + "\""; }).join(", ") + "],");
  lines.push("        mono: [" + tokens.typography.families.monoVar.split(",").map(function(f) { return "\"" + f.trim().replace(/"/g, "") + "\""; }).join(", ") + "]");
  lines.push("      },");

  // Font sizes
  lines.push("      fontSize: {");
  var scaleKeys = Object.keys(tokens.typography.scale);
  for (var m = 0; m < scaleKeys.length; m++) {
    var name = scaleKeys[m];
    var s = tokens.typography.scale[name];
    var fsComma = m < scaleKeys.length - 1 ? "," : "";
    lines.push("        \"" + name + "\": [\"" + s.size + "px\", { lineHeight: \"" + s.lineHeight + "\", letterSpacing: \"" + s.letterSpacing + "\", fontWeight: \"" + s.weight + "\" }]" + fsComma);
  }
  lines.push("      },");

  // Spacing
  lines.push("      spacing: {");
  var spKeys = Object.keys(tokens.spacing.tokens);
  for (var n = 0; n < spKeys.length; n++) {
    var spComma = n < spKeys.length - 1 ? "," : "";
    lines.push("        \"" + spKeys[n] + "\": \"" + tokens.spacing.tokens[spKeys[n]] + "\"" + spComma);
  }
  lines.push("      },");

  // Border radius
  lines.push("      borderRadius: {");
  var radKeys = Object.keys(tokens.radius);
  for (var p = 0; p < radKeys.length; p++) {
    var radComma = p < radKeys.length - 1 ? "," : "";
    lines.push("        \"" + radKeys[p] + "\": \"" + tokens.radius[radKeys[p]] + "\"" + radComma);
  }
  lines.push("      },");

  // Box shadows
  lines.push("      boxShadow: {");
  var shadKeys = Object.keys(tokens.shadow);
  for (var q = 0; q < shadKeys.length; q++) {
    var shComma = q < shadKeys.length - 1 ? "," : "";
    lines.push("        \"" + shadKeys[q] + "\": \"" + tokens.shadow[shadKeys[q]] + "\"" + shComma);
  }
  lines.push("      }");

  lines.push("    }");
  lines.push("  }");
  lines.push("};");

  return lines.join("\n");
}

/* ── SCSS Variables ── */

function toSCSS(tokens) {
  var lines = [];
  lines.push("// hextodesign — SCSS Design Tokens");
  lines.push("// Generated " + tokens.meta.created + " from " + tokens.meta.source);
  lines.push("");

  // Brand palette
  lines.push("// Brand");
  var brandKeys = Object.keys(tokens.color.brand);
  for (var i = 0; i < brandKeys.length; i++) {
    lines.push("$brand-" + brandKeys[i] + ": " + tokens.color.brand[brandKeys[i]].hex + ";");
  }

  // Semantic
  lines.push("");
  lines.push("// Semantic");
  var semKeys = Object.keys(tokens.color.semantic);
  for (var j = 0; j < semKeys.length; j++) {
    var key = semKeys[j];
    var sem = tokens.color.semantic[key];
    lines.push("$" + key + ": " + sem.base + ";");
    lines.push("$" + key + "-light: " + sem.light + ";");
    lines.push("$" + key + "-dark: " + sem.dark + ";");
  }

  // Surfaces light
  lines.push("");
  lines.push("// Surfaces — Light");
  var lightKeys = Object.keys(tokens.color.surface.light);
  for (var k = 0; k < lightKeys.length; k++) {
    lines.push("$surface-" + lightKeys[k] + ": " + tokens.color.surface.light[lightKeys[k]] + ";");
  }

  // Surfaces dark
  lines.push("");
  lines.push("// Surfaces — Dark");
  var darkKeys = Object.keys(tokens.color.surface.dark);
  for (var r = 0; r < darkKeys.length; r++) {
    lines.push("$surface-dark-" + darkKeys[r] + ": " + tokens.color.surface.dark[darkKeys[r]] + ";");
  }

  // Typography
  lines.push("");
  lines.push("// Typography");
  lines.push("$font-sans: " + tokens.typography.families.cssVar + ";");
  lines.push("$font-mono: " + tokens.typography.families.monoVar + ";");
  var scaleKeys = Object.keys(tokens.typography.scale);
  for (var m = 0; m < scaleKeys.length; m++) {
    var name = scaleKeys[m];
    var s = tokens.typography.scale[name];
    lines.push("$text-" + name + "-size: " + s.size + "px;");
    lines.push("$text-" + name + "-weight: " + s.weight + ";");
    lines.push("$text-" + name + "-lh: " + s.lineHeight + ";");
    lines.push("$text-" + name + "-ls: " + s.letterSpacing + ";");
  }

  // Spacing
  lines.push("");
  lines.push("// Spacing");
  var spKeys = Object.keys(tokens.spacing.tokens);
  for (var n = 0; n < spKeys.length; n++) {
    var spName = spKeys[n].toString().replace(".", "_");
    lines.push("$space-" + spName + ": " + tokens.spacing.tokens[spKeys[n]] + ";");
  }

  // Radius
  lines.push("");
  lines.push("// Radius");
  var radKeys = Object.keys(tokens.radius);
  for (var p = 0; p < radKeys.length; p++) {
    lines.push("$radius-" + radKeys[p] + ": " + tokens.radius[radKeys[p]] + ";");
  }

  // Shadows
  lines.push("");
  lines.push("// Shadows");
  var shadKeys = Object.keys(tokens.shadow);
  for (var q = 0; q < shadKeys.length; q++) {
    lines.push("$shadow-" + shadKeys[q] + ": " + tokens.shadow[shadKeys[q]] + ";");
  }

  return lines.join("\n");
}

/* ── Figma Tokens (Design Tokens Community Group format) ── */

function toFigmaTokens(tokens) {
  var figma = {};

  // Brand colors
  figma.brand = {};
  var brandKeys = Object.keys(tokens.color.brand);
  for (var i = 0; i < brandKeys.length; i++) {
    figma.brand[brandKeys[i]] = {
      value: tokens.color.brand[brandKeys[i]].hex,
      type: "color"
    };
  }

  // Semantic colors
  figma.semantic = {};
  var semKeys = Object.keys(tokens.color.semantic);
  for (var j = 0; j < semKeys.length; j++) {
    var key = semKeys[j];
    var sem = tokens.color.semantic[key];
    figma.semantic[key] = {
      base:  { value: sem.base,  type: "color" },
      light: { value: sem.light, type: "color" },
      dark:  { value: sem.dark,  type: "color" }
    };
  }

  // Surfaces
  figma.surface = { light: {}, dark: {} };
  var lightKeys = Object.keys(tokens.color.surface.light);
  for (var k = 0; k < lightKeys.length; k++) {
    figma.surface.light[lightKeys[k]] = { value: tokens.color.surface.light[lightKeys[k]], type: "color" };
  }
  var darkKeys = Object.keys(tokens.color.surface.dark);
  for (var r = 0; r < darkKeys.length; r++) {
    figma.surface.dark[darkKeys[r]] = { value: tokens.color.surface.dark[darkKeys[r]], type: "color" };
  }

  // Typography
  figma.typography = {};
  var scaleKeys = Object.keys(tokens.typography.scale);
  for (var m = 0; m < scaleKeys.length; m++) {
    var name = scaleKeys[m];
    var s = tokens.typography.scale[name];
    figma.typography[name] = {
      value: {
        fontFamily: tokens.typography.families.sans,
        fontSize: s.size + "px",
        fontWeight: s.weight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing
      },
      type: "typography"
    };
  }

  // Spacing
  figma.spacing = {};
  var spKeys = Object.keys(tokens.spacing.tokens);
  for (var n = 0; n < spKeys.length; n++) {
    figma.spacing["space-" + spKeys[n].toString().replace(".", "_")] = {
      value: tokens.spacing.tokens[spKeys[n]],
      type: "spacing"
    };
  }

  // Radius
  figma.radius = {};
  var radKeys = Object.keys(tokens.radius);
  for (var p = 0; p < radKeys.length; p++) {
    figma.radius[radKeys[p]] = { value: tokens.radius[radKeys[p]], type: "borderRadius" };
  }

  // Shadows
  figma.shadow = {};
  var shadKeys = Object.keys(tokens.shadow);
  for (var q = 0; q < shadKeys.length; q++) {
    figma.shadow[shadKeys[q]] = { value: tokens.shadow[shadKeys[q]], type: "boxShadow" };
  }

  return JSON.stringify(figma, null, 2);
}

/* ── Documentation (Markdown) ── */

function toDocMarkdown(tokens) {
  var lines = [];
  lines.push("# Design System — " + tokens.meta.source);
  lines.push("");
  lines.push("Generated by [hextodesign](https://hextodesign.com) on " + tokens.meta.created.split("T")[0]);
  lines.push("");

  // Brand palette
  lines.push("## Brand Palette");
  lines.push("");
  lines.push("| Stop | Hex | OKLCH |");
  lines.push("|------|-----|-------|");
  var brandKeys = Object.keys(tokens.color.brand);
  for (var i = 0; i < brandKeys.length; i++) {
    var b = tokens.color.brand[brandKeys[i]];
    lines.push("| " + brandKeys[i] + " | `" + b.hex + "` | `" + b.oklch + "` |");
  }

  // Semantic
  lines.push("");
  lines.push("## Semantic Colors");
  lines.push("");
  lines.push("| Role | Base | Light | Dark |");
  lines.push("|------|------|-------|------|");
  var semKeys = Object.keys(tokens.color.semantic);
  for (var j = 0; j < semKeys.length; j++) {
    var sem = tokens.color.semantic[semKeys[j]];
    lines.push("| " + sem.label + " | `" + sem.base + "` | `" + sem.light + "` | `" + sem.dark + "` |");
  }

  // Contrast
  lines.push("");
  lines.push("## Contrast Ratios");
  lines.push("");
  lines.push("| Pair | Ratio | Grade |");
  lines.push("|------|-------|-------|");
  var cKeys = Object.keys(tokens.contrast);
  for (var c = 0; c < cKeys.length; c++) {
    var cr = tokens.contrast[cKeys[c]];
    lines.push("| " + cKeys[c] + " | " + cr.ratio.toFixed(2) + ":1 | " + cr.grade + " |");
  }

  // Typography
  lines.push("");
  lines.push("## Typography");
  lines.push("");
  lines.push("**Sans:** " + tokens.typography.families.sans + "  ");
  lines.push("**Mono:** " + tokens.typography.families.mono + "  ");
  lines.push("**Scale ratio:** " + tokens.typography.ratio + " (Major Third)");
  lines.push("");
  lines.push("| Style | Size | Weight | Line Height | Letter Spacing |");
  lines.push("|-------|------|--------|-------------|----------------|");
  var scaleKeys = Object.keys(tokens.typography.scale);
  for (var m = 0; m < scaleKeys.length; m++) {
    var s = tokens.typography.scale[scaleKeys[m]];
    lines.push("| " + scaleKeys[m] + " | " + s.size + "px | " + s.weight + " | " + s.lineHeight + " | " + s.letterSpacing + " |");
  }

  return lines.join("\n");
}

/* ── Exports ── */

module.exports = {
  toCSSVariables: toCSSVariables,
  toJSON: toJSON,
  toTailwindConfig: toTailwindConfig,
  toSCSS: toSCSS,
  toFigmaTokens: toFigmaTokens,
  toDocMarkdown: toDocMarkdown
};
