// Render the target mock from a fixed view so we can eyeball the box.
// Usage: node scripts/demo.js [none|256|truecolor]
import { render } from "../lib/render.js";

const mode = process.argv[2] || "none";

const view = {
  model: "opus-4.8",
  effort: "MAX",
  cost: 30.05,
  rows: [
    { stat: "HP", name: "Weekly", pct: 71, reset: "3d" },
    { stat: "MP", name: "5-Hour", pct: 91, reset: "2h" },
    { stat: "BAG", name: "Context", pct: 52, reset: "—" },
  ],
};

process.stdout.write(render(view, { mode }) + "\n");
