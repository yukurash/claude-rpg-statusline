// Render several states for screenshots / manual inspection.
// Usage: node scripts/demo-all.js [none|256|truecolor]
import { render } from "../lib/render.js";

const mode = process.argv[2] || "truecolor";
const show = (title, view, opts = {}) => {
  process.stdout.write(`\n# ${title}\n`);
  process.stdout.write(render(view, { mode, ...opts }) + "\n");
};

show("Calm", {
  model: "opus-4.8", effort: "MAX", cost: 12.4,
  rows: [
    { stat: "HP", name: "Weekly", pct: 41, reset: "3d" },
    { stat: "MP", name: "5-Hour", pct: 52, reset: "2h" },
    { stat: "BAG", name: "Context", pct: 33, reset: "—" },
  ],
});

show("Ailing (PAR + PSN + CRS) + combat event", {
  model: "opus-4.8", effort: "MAX", cost: 30.05,
  badges: ["PSN", "PAR", "CRS"],
  rows: [
    { stat: "HP", name: "Weekly", pct: 82, reset: "2d" },
    { stat: "MP", name: "5-Hour", pct: 100, reset: "1h" },
    { stat: "BAG", name: "Context", pct: 93, reset: "—" },
  ],
}, { event: "CRITICAL HIT!  code struck" });

show("Cold start (rate limits not yet known)", {
  model: "sonnet-5", effort: "—", cost: 0,
  rows: [
    { stat: "HP", name: "Weekly", pct: null, reset: "--" },
    { stat: "MP", name: "5-Hour", pct: null, reset: "--" },
    { stat: "BAG", name: "Context", pct: 8, reset: "—" },
  ],
});

show("ASCII fallback frame", {
  model: "haiku-4.5", effort: "LOW", cost: 3.1,
  rows: [
    { stat: "HP", name: "Weekly", pct: 61, reset: "5d" },
    { stat: "MP", name: "5-Hour", pct: 30, reset: "4h" },
    { stat: "BAG", name: "Context", pct: 45, reset: "—" },
  ],
}, { ascii: true });
