// Compare gauge glyph styles in the real box.
import { render } from "../lib/render.js";

const base = {
  model: "opus-4.8",
  effort: "MAX",
  cost: 30.05,
  rows: [
    { name: "Weekly", pct: 41, reset: "3d" },
    { name: "5-Hour", pct: 71, reset: "2h" },
    { name: "Context", pct: 93, reset: "—" },
  ],
};

const styles = {
  "bars (current)": ["█", "░"],
  pips: ["▰", "▱"],
  "orbs (DQ HP)": ["◆", "◇"],
  dots: ["●", "○"],
};

for (const [label, glyphs] of Object.entries(styles)) {
  console.log("\n### " + label);
  console.log(render(base, { mode: "none", glyphs }));
}
