// Horizontal usage gauge built from block elements.
//
// A filled cell (█) is "used", an empty cell (░) is "remaining", so the amount
// of ░ left visually equals how much head-room you still have. The gauge always
// shows usage (matching `/usage`), never remaining, to avoid the "is 71 used or
// left?" ambiguity.

// Retro game-meter pips by default (filled / empty). Other styles (bars, orbs,
// dots) are selectable via CCRPG_GAUGE.
export const FILLED = "▰"; // filled pip
export const EMPTY = "▱"; // empty pip

export function clampPct(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  return Math.max(0, Math.min(100, pct));
}

export function gauge(pct, width = 16, glyphs) {
  const f = (glyphs && glyphs[0]) || FILLED;
  const e = (glyphs && glyphs[1]) || EMPTY;
  const p = clampPct(pct);
  if (p == null) return e.repeat(width); // unknown -> empty track
  const filled = Math.round((p / 100) * width);
  return f.repeat(filled) + e.repeat(width - filled);
}
