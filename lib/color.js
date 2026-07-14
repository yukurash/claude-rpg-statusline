// ANSI color helpers with graceful degradation:
//   truecolor (24-bit)  ->  256-color  ->  no color
//
// Color never affects layout: widths are always computed on the raw text
// before wrapping in escape codes (see lib/width.js stripAnsi).

const RESET = "\x1b[0m";

// Danger thresholds shared across the UI.
export const THRESHOLDS = { warn: 60, danger: 85 };

// Palette as {rgb:[r,g,b], xterm:256-code}.
const PALETTE = {
  green: { rgb: [80, 220, 120], xterm: 78 },
  yellow: { rgb: [240, 200, 70], xterm: 221 },
  red: { rgb: [240, 90, 90], xterm: 203 },
  dim: { rgb: [130, 135, 155], xterm: 245 },
  border: { rgb: [95, 145, 255], xterm: 69 }, // Dragon-Quest blue window frame
  accent: { rgb: [245, 210, 110], xterm: 179 }, // gold — cursor / GOLD / labels
};

export function detectMode(env = process.env) {
  const override = (env.CCRPG_COLOR || "").toLowerCase();
  if (override === "none" || override === "off") return "none";
  if (override === "truecolor" || override === "24bit") return "truecolor";
  if (override === "256") return "256";
  if (env.NO_COLOR != null) return "none";

  const colorterm = (env.COLORTERM || "").toLowerCase();
  if (colorterm.includes("truecolor") || colorterm.includes("24bit")) {
    return "truecolor";
  }
  const term = (env.TERM || "").toLowerCase();
  if (term.includes("256")) return "256";
  if (term === "dumb") return "none";
  // Modern default: Windows Terminal / VS Code / iTerm all do truecolor but do
  // not always export COLORTERM to a spawned statusline. Assume truecolor and
  // let CCRPG_COLOR override when a terminal can't handle it.
  return "truecolor";
}

function wrap(mode, name, text) {
  if (mode === "none") return text;
  const c = PALETTE[name];
  if (!c) return text;
  if (mode === "truecolor") {
    const [r, g, b] = c.rgb;
    return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
  }
  return `\x1b[38;5;${c.xterm}m${text}${RESET}`;
}

// Build a color helper bound to a mode.
export function makeColors(mode) {
  const api = {};
  for (const name of Object.keys(PALETTE)) {
    api[name] = (text) => wrap(mode, name, text);
  }
  api.byPct = (text, pct) => {
    if (pct == null) return api.dim(text);
    if (pct >= THRESHOLDS.danger) return api.red(text);
    if (pct >= THRESHOLDS.warn) return api.yellow(text);
    return api.green(text);
  };
  api.mode = mode;
  return api;
}
