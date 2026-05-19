/*  hextodesign — Lightweight browser-only color utilities
    Just the math needed for real-time UI (swatch previews, hue slider).
    The full engine lives server-side — this file has NO generation logic. */

(function() {
  "use strict";

  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  }

  function rgbToHex(r, g, b) {
    var toHex = function(c) {
      var v = Math.round(Math.max(0, Math.min(1, c)) * 255);
      return (v < 16 ? "0" : "") + v.toString(16);
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function linearize(c) {
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  }

  function delinearize(c) {
    return c > 0.0031308 ? 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055 : 12.92 * c;
  }

  function rgbToOklch(r, g, b) {
    var lr = linearize(r), lg = linearize(g), lb = linearize(b);
    var l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    var m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    var s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    var l = Math.cbrt(l_), m = Math.cbrt(m_), s = Math.cbrt(s_);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var bv = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var C = Math.sqrt(a * a + bv * bv);
    var H = ((Math.atan2(bv, a) * 180 / Math.PI) + 360) % 360;
    return { L: L, C: C, H: H };
  }

  function oklchToRgb(L, C, H) {
    var hRad = H * Math.PI / 180;
    var a = C * Math.cos(hRad);
    var b = C * Math.sin(hRad);
    var l = L + 0.3963377774 * a + 0.2158037573 * b;
    var m = L - 0.1055613458 * a - 0.0638541728 * b;
    var s = L - 0.0894841775 * a - 1.2914855480 * b;
    l = l * l * l; m = m * m * m; s = s * s * s;
    var r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    var g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    var bv = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    return [
      Math.max(0, Math.min(1, delinearize(r))),
      Math.max(0, Math.min(1, delinearize(g))),
      Math.max(0, Math.min(1, delinearize(bv)))
    ];
  }

  function oklchToHex(L, C, H) {
    var rgb = oklchToRgb(L, C, H);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  }

  function relativeLuminance(r, g, b) {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function contrastRatio(hex1, hex2) {
    var rgb1 = hexToRgb(hex1), rgb2 = hexToRgb(hex2);
    var l1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
    var l2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
    var lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function contrastGrade(ratio) {
    if (ratio >= 7) return "AAA";
    if (ratio >= 4.5) return "AA";
    if (ratio >= 3) return "AA-lg";
    return "Fail";
  }

  // Expose as global
  window.PPColorUtils = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToOklch: rgbToOklch,
    oklchToRgb: oklchToRgb,
    oklchToHex: oklchToHex,
    contrastRatio: contrastRatio,
    contrastGrade: contrastGrade
  };

})();
