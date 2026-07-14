// Rendering core for the RPG status window.
//
// `render(view, opts)` is a pure function: given a normalized view object it
// returns the multi-line box as a string. `parseInput(raw, ctx)` turns the raw
// Claude Code statusline stdin JSON into that view object, applying all
// missing-data fallbacks. Keeping them separate makes the layout golden-testable
// without depending on the clock or environment.

import { stringWidth, padRight, center, fitLR } from "./width.js";
import { gauge } from "./gauge.js";
import { makeColors } from "./color.js";
import {
  formatTokens,
  resetLabel,
  formatEffort,
  modelLabel,
  levelFromTokens,
} from "./format.js";

// --- Fixed layout. Inner width = 12 + 18 + 8 + 7 + 3 dividers = 48. ---
export const COL = { name: 12, gauge: 18, used: 8, reset: 7 };
export const INNER = COL.name + COL.gauge + COL.used + COL.reset + 3;
export const BAR = 16;

const FRAME = {
  unicode: {
    tl: "╔", tr: "╗", bl: "╚", br: "╝",
    h: "═", v: "║",
    sepL: "╟", sepR: "╢", down: "┬", up: "╧", hl: "─", iv: "│",
  },
  ascii: {
    tl: "+", tr: "+", bl: "+", br: "+",
    h: "=", v: "|",
    sepL: "+", sepR: "+", down: "+", up: "+", hl: "-", iv: "|",
  },
};

function rowHasCursor(rows) {
  let idx = -1;
  let best = -1;
  rows.forEach((r, i) => {
    if (r.pct != null && r.pct > best) {
      best = r.pct;
      idx = i;
    }
  });
  return idx;
}

// Normalize raw stdin JSON into a view object. `ctx` = { now, env, state }.
export function parseInput(raw, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const j = raw || {};

  const cost = j.cost || {};
  const cw = j.context_window || {};
  const usage = cw.current_usage || {};
  const rl = j.rate_limits || {};

  const tokens =
    (usage.input_tokens || 0) +
    (usage.output_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0);

  const ctxPct =
    cw.used_percentage != null ? Math.round(cw.used_percentage) : null;

  const five = rl.five_hour || {};
  const seven = rl.seven_day || {};
  const hasWeekly = seven.used_percentage != null;
  const has5h = five.used_percentage != null;

  const rows = [
    {
      name: "Weekly",
      pct: hasWeekly ? Math.round(seven.used_percentage) : null,
      reset: hasWeekly ? resetLabel("weekly", seven.resets_at, now) : "--",
    },
    {
      name: "5-Hour",
      pct: has5h ? Math.round(five.used_percentage) : null,
      reset: has5h ? resetLabel("5h", five.resets_at, now) : "--",
    },
    {
      name: "Context",
      pct: ctxPct,
      reset: resetLabel("context", null, now),
    },
  ];

  return {
    model: modelLabel(j.model),
    effort: formatEffort(j.effort && j.effort.level),
    lv: levelFromTokens(tokens),
    tokens,
    rows,
  };
}

// Pure renderer. opts = { mode: "truecolor"|"256"|"none", ascii: bool }.
export function render(view, opts = {}) {
  const f = opts.ascii ? FRAME.ascii : FRAME.unicode;
  const c = makeColors(opts.mode || "none");

  const bar = (n) => f.h.repeat(n);
  const seg = (n) => f.hl.repeat(n);

  const top = c.border(f.tl + bar(INNER) + f.tr);
  const sep = c.border(
    f.sepL +
      seg(COL.name) + f.down +
      seg(COL.gauge) + f.down +
      seg(COL.used) + f.down +
      seg(COL.reset) + f.sepR
  );
  const bottom = c.border(
    f.bl +
      bar(COL.name) + f.up +
      bar(COL.gauge) + f.up +
      bar(COL.used) + f.up +
      bar(COL.reset) + f.br
  );

  // Header rows (span the full inner width).
  const modelLine =
    c.border(f.v) +
    fitLR(" MODEL   " + view.model, "Lv." + view.lv + " ", INNER) +
    c.border(f.v);
  const effortLine =
    c.border(f.v) +
    fitLR(" EFFORT  " + view.effort, "GOLD  " + formatTokens(view.tokens) + " ", INNER) +
    c.border(f.v);

  const cursorIdx = rowHasCursor(view.rows);

  const meterLines = view.rows.map((r, i) => {
    const cursor = i === cursorIdx ? "▶" : " ";
    const cell1 = cursor + padRight(r.name, COL.name - 1);
    const rawBar = gauge(r.pct, BAR);
    const cell2 = " " + c.byPct(rawBar, r.pct) + " ";
    const usedTxt = r.pct == null ? "--/--" : `${r.pct}/100`;
    const cell3 = center(usedTxt, COL.used);
    const cell4 = center(r.reset, COL.reset);
    const nameCell = i === cursorIdx ? c.accent(cell1) : cell1;
    return (
      c.border(f.v) + nameCell + c.border(f.iv) +
      cell2 + c.border(f.iv) +
      cell3 + c.border(f.iv) +
      cell4 + c.border(f.v)
    );
  });

  return [top, modelLine, effortLine, sep, ...meterLines, bottom].join("\n");
}

// Width guard used by tests: every rendered line (color stripped) must be
// exactly INNER + 2 border cells wide.
export function lineWidths(text) {
  return text.split("\n").map((l) => stringWidth(l));
}
