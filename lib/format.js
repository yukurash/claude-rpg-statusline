// Value formatting: tokens (GOLD), reset countdowns, effort, model, job class.

// GOLD = cumulative session cost in USD (the only accurate cumulative "spend"
// the statusline payload provides; there is no cumulative token counter).
export function formatCostUsd(n) {
  if (n == null || Number.isNaN(n)) return "$--";
  return "$" + Number(n).toFixed(2);
}

// Countdown label from an epoch-seconds reset time. `kind === "context"` has no
// timed reset (cleared by /compact or a new session) and renders as an em dash.
export function resetLabel(kind, resetsAtEpoch, nowMs = Date.now()) {
  if (kind === "context") return "—"; // —
  if (resetsAtEpoch == null) return "—";
  const diffMs = resetsAtEpoch * 1000 - nowMs;
  if (diffMs <= 0) return "now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins + "m";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h";
  const days = Math.floor(hours / 24);
  return days + "d";
}

const EFFORT_MAP = {
  max: "MAX",
  xhigh: "X-HI",
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

export function formatEffort(level) {
  if (!level) return "—";
  return EFFORT_MAP[String(level).toLowerCase()] || String(level).toUpperCase();
}

// Turn a raw model id/name into a short label like "opus-4.8".
export function modelLabel(model) {
  if (!model) return "unknown";
  // Prefer the id (e.g. "claude-opus-4-8" -> "opus-4.8"); display_name is often
  // just "Opus" and loses the version.
  const raw = model.id || model.display_name || String(model);
  let s = String(raw).trim();
  s = s.replace(/^claude-/, "");
  // claude-opus-4-8 -> opus-4.8   (join a trailing "-<major>-<minor>")
  s = s.replace(/-(\d+)-(\d+)$/, "-$1.$2");
  return s;
}

