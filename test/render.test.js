import { test } from "node:test";
import assert from "node:assert/strict";
import { render, lineWidths, INNER } from "../lib/render.js";

const OUTER = INNER + 2; // + two border cells

const normal = {
  model: "opus-4.8",
  effort: "MAX",
  cost: 30.05,
  rows: [
    { stat: "HP", name: "Weekly", pct: 71, reset: "3d" },
    { stat: "MP", name: "5-Hour", pct: 91, reset: "2h" },
    { stat: "BAG", name: "Context", pct: 52, reset: "—" },
  ],
};

const coldStart = {
  model: "sonnet-5",
  effort: "—",
  cost: 0,
  rows: [
    { stat: "HP", name: "Weekly", pct: null, reset: "--" },
    { stat: "MP", name: "5-Hour", pct: null, reset: "--" },
    { stat: "BAG", name: "Context", pct: null, reset: "—" },
  ],
};

const ailing = {
  ...normal,
  badges: ["PSN", "PAR", "CRS"],
};

// The regression the user cares about: the table must never be misaligned.
// The box is always the first 9 lines (incl. the column-header row); any
// trailer below it is free-form.
test("every box line has identical display width in all modes", () => {
  for (const mode of ["none", "256", "truecolor"]) {
    for (const view of [normal, coldStart, ailing]) {
      const widths = lineWidths(render(view, { mode })).slice(0, 9);
      assert.equal(widths.length, 9);
      for (const w of widths) assert.equal(w, OUTER, `mode=${mode}`);
    }
  }
});

test("ascii fallback frame is also perfectly aligned", () => {
  const out = render(normal, { mode: "none", ascii: true });
  for (const w of lineWidths(out).slice(0, 9)) assert.equal(w, OUTER);
  assert.ok(out.includes("+") && out.includes("|") && out.includes("="));
  assert.ok(!out.includes("║"));
});

test("reproduces the approved mock content (mode none)", () => {
  const lines = render(normal, { mode: "none" }).split("\n");
  // Header
  assert.match(lines[1], /MODEL {3}opus-4\.8/);
  assert.ok(!lines[1].includes("Lv."), "no level shown");
  assert.match(lines[2], /EFFORT {2}MAX/);
  assert.ok(lines[2].includes("GOLD  $30.05"));
  // Column header row.
  assert.match(lines[4], /RESOURCE.*LIFE.*LEFT.*RECOVER/);
  // Gauges drain HP-style: they show what REMAINS (default pips style).
  assert.ok(lines[5].includes("▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱")); // 71% used -> 29 left
  assert.ok(lines[6].includes("▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱")); // 91% used ->  9 left
  assert.ok(lines[7].includes("▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱")); // 52% used -> 48 left
  // LEFT cells show remaining points.
  assert.ok(lines[5].includes("29/100"));
  assert.ok(lines[6].includes("9/100"));
  assert.ok(lines[7].includes("48/100"));
});

test("cursor points at the most at-risk row (least left)", () => {
  const lines = render(normal, { mode: "none" }).split("\n");
  assert.ok(lines[6].startsWith("║▶MP  5-Hour"), "cursor on MP/5-Hour (9 left)");
  assert.ok(lines[5].startsWith("║ HP  Weekly"), "no cursor on HP/Weekly");
  assert.ok(lines[7].startsWith("║ BAG Context"), "no cursor on BAG/Context");
});

test("status-ailment badges render on the EFFORT line", () => {
  const lines = render(ailing, { mode: "none" }).split("\n");
  assert.ok(lines[2].includes("MAX  [PSN][PAR][CRS]"));
  assert.ok(lines[2].includes("GOLD  $30.05"), "GOLD survives next to badges");
  const calm = render(normal, { mode: "none" }).split("\n");
  assert.ok(!calm[2].includes("["), "no badges when healthy");
});

test("unknown percentages render an empty gauge, --/-- and no cursor", () => {
  const out = render(coldStart, { mode: "none" });
  assert.ok(out.includes("▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱")); // fully empty track
  assert.ok(out.includes("--/--"));
  assert.ok(!out.includes("▶"), "no cursor when nothing is known");
});
