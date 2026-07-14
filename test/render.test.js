import { test } from "node:test";
import assert from "node:assert/strict";
import { render, lineWidths, INNER } from "../lib/render.js";

const OUTER = INNER + 2; // + two border cells

const normal = {
  model: "opus-4.8",
  effort: "MAX",
  cost: 30.05,
  rows: [
    { name: "Weekly", pct: 71, reset: "3d" },
    { name: "5-Hour", pct: 91, reset: "2h" },
    { name: "Context", pct: 52, reset: "—" },
  ],
};

const coldStart = {
  model: "sonnet-5",
  effort: "—",
  cost: 0,
  rows: [
    { name: "Weekly", pct: null, reset: "--" },
    { name: "5-Hour", pct: null, reset: "--" },
    { name: "Context", pct: null, reset: "—" },
  ],
};

// The regression the user cares about: the table must never be misaligned.
// The box is always the first 8 lines; any trailer below it is free-form.
test("every box line has identical display width in all modes", () => {
  for (const mode of ["none", "256", "truecolor"]) {
    for (const view of [normal, coldStart]) {
      const widths = lineWidths(render(view, { mode })).slice(0, 8);
      assert.equal(widths.length, 8);
      for (const w of widths) assert.equal(w, OUTER, `mode=${mode}`);
    }
  }
});

test("ascii fallback frame is also perfectly aligned", () => {
  const out = render(normal, { mode: "none", ascii: true });
  for (const w of lineWidths(out).slice(0, 8)) assert.equal(w, OUTER);
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
  // Gauges reflect usage percentages.
  assert.ok(lines[4].includes("███████████░░░░░")); // 71%
  assert.ok(lines[5].includes("███████████████░")); // 91%
  assert.ok(lines[6].includes("████████░░░░░░░░")); // 52%
  // Used cells.
  assert.ok(lines[4].includes("71/100"));
  assert.ok(lines[5].includes("91/100"));
  assert.ok(lines[6].includes("52/100"));
});

test("cursor points at the highest-usage available row", () => {
  const lines = render(normal, { mode: "none" }).split("\n");
  assert.ok(lines[5].startsWith("║▶5-Hour"), "cursor on 5-Hour (91%)");
  assert.ok(lines[4].startsWith("║ Weekly"), "no cursor on Weekly");
  assert.ok(lines[6].startsWith("║ Context"), "no cursor on Context");
});

test("unknown percentages render an empty gauge, --/-- and no cursor", () => {
  const out = render(coldStart, { mode: "none" });
  assert.ok(out.includes("░░░░░░░░░░░░░░░░")); // fully empty track
  assert.ok(out.includes("--/--"));
  assert.ok(!out.includes("▶"), "no cursor when nothing is known");
});
