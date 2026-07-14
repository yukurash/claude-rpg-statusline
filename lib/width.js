// Display-width utilities for terminal rendering.
//
// The RPG box relies on every line being exactly the same display width, so we
// need a width function that agrees with how a monospace terminal lays out
// characters. We deliberately keep the box built from half-width glyphs only
// (ASCII, box-drawing U+2500–257F, block elements U+2580–259F, and a few
// geometric shapes like ▶ ★), all of which are width 1. Emoji and CJK are
// width 2 and only ever appear in free-form event overlays, never inside the
// fixed-width table.

const ANSI_RE = /\x1b\[[0-9;]*m/g;

// Ranges that a terminal renders two cells wide. Intentionally excludes
// box-drawing / block / geometric-shape ranges used by the frame.
const WIDE_RANGES = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0x303e], // CJK radicals, Kangxi
  [0x3041, 0x33ff], // Hiragana, Katakana, CJK symbols
  [0x3400, 0x4dbf], // CJK Ext A
  [0x4e00, 0x9fff], // CJK Unified
  [0xa000, 0xa4cf], // Yi
  [0xac00, 0xd7a3], // Hangul syllables
  [0xf900, 0xfaff], // CJK compat
  [0xfe10, 0xfe19], // vertical forms
  [0xfe30, 0xfe6f], // CJK compat forms, small forms
  [0xff00, 0xff60], // fullwidth forms
  [0xffe0, 0xffe6], // fullwidth signs
  [0x1f300, 0x1faff], // emoji / symbols & pictographs
  [0x20000, 0x3fffd], // CJK Ext B+
];

function isWide(cp) {
  for (const [lo, hi] of WIDE_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

// Zero-width: combining marks and variation selectors.
function isZeroWidth(cp) {
  return (
    (cp >= 0x0300 && cp <= 0x036f) || // combining diacritics
    (cp >= 0x200b && cp <= 0x200f) || // zero-width space / marks
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors
    cp === 0xfeff
  );
}

export function stripAnsi(str) {
  return String(str).replace(ANSI_RE, "");
}

export function stringWidth(str) {
  const plain = stripAnsi(str);
  let w = 0;
  for (const ch of plain) {
    const cp = ch.codePointAt(0);
    if (isZeroWidth(cp)) continue;
    w += isWide(cp) ? 2 : 1;
  }
  return w;
}

export function padRight(str, width) {
  const w = stringWidth(str);
  if (w >= width) return truncate(str, width);
  return str + " ".repeat(width - w);
}

export function padLeft(str, width) {
  const w = stringWidth(str);
  if (w >= width) return truncate(str, width);
  return " ".repeat(width - w) + str;
}

export function center(str, width) {
  const w = stringWidth(str);
  if (w >= width) return truncate(str, width);
  const total = width - w;
  const left = Math.floor(total / 2);
  return " ".repeat(left) + str + " ".repeat(total - left);
}

// Truncate to a display width (never splits a wide char in half).
export function truncate(str, width) {
  let out = "";
  let w = 0;
  for (const ch of stripAnsi(str)) {
    const cp = ch.codePointAt(0);
    const cw = isZeroWidth(cp) ? 0 : isWide(cp) ? 2 : 1;
    if (w + cw > width) break;
    out += ch;
    w += cw;
  }
  return out + " ".repeat(Math.max(0, width - w));
}

// Place `left` and `right` on one line of exactly `width` cells.
export function fitLR(left, right, width) {
  const lw = stringWidth(left);
  const rw = stringWidth(right);
  let mid = width - lw - rw;
  if (mid < 1) {
    // Not enough room: keep the right label, truncate the left.
    const room = Math.max(0, width - rw - 1);
    return truncate(left, room) + " " + right;
  }
  return left + " ".repeat(mid) + right;
}
