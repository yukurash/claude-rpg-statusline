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
import { dangerMessage } from "./flourish.js";
import {
  formatCostUsd,
  resetLabel,
  formatEffort,
  modelLabel,
} from "./format.js";
import { expToLevel } from "./level.js";

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
  const rl = j.rate_limits || {};

  const ctxPct =
    cw.used_percentage != null ? Math.round(cw.used_percentage) : null;

  const five = rl.five_hour || {};
  const seven = rl.seven_day || {};
  const hasWeekly = seven.used_percentage != null;
  const has5h = five.used_percentage != null;

  // RPG stat mapping: Weekly = HP (long-term life), 5-Hour = MP (recovers
  // faster), Context = BAG (inventory space; /compact empties it).
  const rows = [
    {
      stat: "HP",
      name: "Weekly",
      pct: hasWeekly ? Math.round(seven.used_percentage) : null,
      reset: hasWeekly ? resetLabel("weekly", seven.resets_at, now) : "--",
    },
    {
      stat: "MP",
      name: "5-Hour",
      pct: has5h ? Math.round(five.used_percentage) : null,
      reset: has5h ? resetLabel("5h", five.resets_at, now) : "--",
    },
    {
      stat: "BAG",
      name: "Context",
      pct: ctxPct,
      reset: resetLabel("context", null, now),
    },
  ];

  const effort = formatEffort(j.effort && j.effort.level);
  const costUsd = cost.total_cost_usd != null ? cost.total_cost_usd : null;

  // Status ailments, shown as badges on the EFFORT line:
  //   PSN (poison)   — the bag is nearly full, you are slowly dying
  //   PAR (paralyze) — a rate limit is depleted, you cannot act
  //   CRS (curse)    — burning gold at MAX effort (cost >= $10)
  const badges = [];
  if (ctxPct != null && ctxPct >= 90) badges.push("PSN");
  if (rows.some((r) => r.pct != null && r.pct >= 100)) badges.push("PAR");
  if (effort === "MAX" && costUsd != null && costUsd >= 10) badges.push("CRS");

  // Character level from persistent EXP (awarded by the combat-log hook).
  // No hook installed -> no exp key -> no level shown.
  const st = ctx.state;
  const lv = st && st.exp != null ? expToLevel(st.exp) : null;

  return {
    model: modelLabel(j.model),
    effort,
    cost: costUsd,
    badges,
    lv,
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
    fitLR(
      " " + c.dim("MODEL") + "   " + view.model,
      view.lv != null ? c.accent("Lv." + view.lv) + " " : "",
      INNER
    ) +
    c.border(f.v);
  // Status-ailment badges: colored like their DQ counterparts.
  const BADGE_COLOR = { PSN: c.green, PAR: c.yellow, CRS: c.red };
  const badgeTxt = (view.badges || [])
    .map((b) => (BADGE_COLOR[b] || c.red)("[" + b + "]"))
    .join("");

  const effortLine =
    c.border(f.v) +
    fitLR(
      " " + c.dim("EFFORT") + "  " + view.effort + (badgeTxt ? "  " + badgeTxt : ""),
      c.accent("GOLD  " + formatCostUsd(view.cost)) + " ",
      INNER
    ) +
    c.border(f.v);

  // Column header. The gauge and LEFT number show what *remains* (HP-style,
  // the bar drains as you spend); RECOVER = time until the limit refills.
  const colHead =
    c.border(f.v) +
    c.dim(" " + padRight("RESOURCE", COL.name - 1)) + c.border(f.iv) +
    c.dim(center("LIFE", COL.gauge)) + c.border(f.iv) +
    c.dim(center("LEFT", COL.used)) + c.border(f.iv) +
    c.dim(center("RECOVER", COL.reset)) +
    c.border(f.v);

  const cursorIdx = rowHasCursor(view.rows);

  const meterLines = view.rows.map((r, i) => {
    const cursor = i === cursorIdx ? "▶" : " ";
    const label = r.stat ? padRight(r.stat, 4) + r.name : r.name;
    const cell1 = cursor + padRight(label, COL.name - 1);
    // HP-style: the bar and the number show what's LEFT, and drain toward 0.
    // Danger colors stay keyed on usage so red still means "nearly out".
    const left = r.pct == null ? null : 100 - r.pct;
    const rawBar = gauge(left, BAR, opts.glyphs);
    const cell2 = " " + c.byPct(rawBar, r.pct) + " ";
    const leftTxt = left == null ? "--/--" : `${left}/100`;
    const cell3 = c.byPct(center(leftTxt, COL.used), r.pct);
    const cell4 = center(r.reset, COL.reset);
    const nameCell = i === cursorIdx ? c.accent(cell1) : cell1;
    return (
      c.border(f.v) + nameCell + c.border(f.iv) +
      cell2 + c.border(f.iv) +
      cell3 + c.border(f.iv) +
      cell4 + c.border(f.v)
    );
  });

  const box = [top, modelLine, effortLine, sep, colHead, ...meterLines, bottom];

  // Free-form trailer (not width-constrained): a transient event line from a
  // hook/level-up, then a danger line — shown only when relevant, so the calm
  // state stays exactly the 9-line box.
  const trailer = [];
  if (opts.event) trailer.push(c.accent("  ★ " + opts.event)); // ★
  const dmsg = dangerMessage(view, opts.lang || "en");
  if (dmsg) trailer.push(c.red("  ⚠ " + dmsg)); // ⚠

  return [...box, ...trailer].join("\n");
}

// Width guard used by tests: every rendered line (color stripped) must be
// exactly INNER + 2 border cells wide.
export function lineWidths(text) {
  return text.split("\n").map((l) => stringWidth(l));
}
