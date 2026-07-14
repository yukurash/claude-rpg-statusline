// Horizontal meter built from pip/block glyphs.
//
// The gauge itself just fills `pct` of the track. The renderer feeds it the
// *remaining* percentage, so bars read like RPG HP/MP meters: full = healthy,
// draining toward empty as you spend. The column header ("LIFE"/"LEFT")
// resolves the "is 71 used or left?" ambiguity that `/usage` parity used to.

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
