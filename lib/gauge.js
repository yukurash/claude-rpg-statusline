// Horizontal usage gauge built from block elements.
//
// A filled cell (█) is "used", an empty cell (░) is "remaining", so the amount
// of ░ left visually equals how much head-room you still have. The gauge always
// shows usage (matching `/usage`), never remaining, to avoid the "is 71 used or
// left?" ambiguity.

export const FILLED = "█"; // █
export const EMPTY = "░"; // ░

export function clampPct(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  return Math.max(0, Math.min(100, pct));
}

export function gauge(pct, width = 16) {
  const p = clampPct(pct);
  if (p == null) return EMPTY.repeat(width); // unknown -> empty track
  const filled = Math.round((p / 100) * width);
  return FILLED.repeat(filled) + EMPTY.repeat(width - filled);
}
