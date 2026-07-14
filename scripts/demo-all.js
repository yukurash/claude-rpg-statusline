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
    { name: "Weekly", pct: 41, reset: "3d" },
    { name: "5-Hour", pct: 52, reset: "2h" },
    { name: "Context", pct: 33, reset: "—" },
  ],
});

show("Danger + combat event", {
  model: "opus-4.8", effort: "MAX", cost: 30.05,
  rows: [
    { name: "Weekly", pct: 82, reset: "2d" },
    { name: "5-Hour", pct: 100, reset: "1h" },
    { name: "Context", pct: 93, reset: "—" },
  ],
}, { event: "CRITICAL HIT!  code struck" });

show("Cold start (rate limits not yet known)", {
  model: "sonnet-5", effort: "—", cost: 0,
  rows: [
    { name: "Weekly", pct: null, reset: "--" },
    { name: "5-Hour", pct: null, reset: "--" },
    { name: "Context", pct: 8, reset: "—" },
  ],
});

show("ASCII fallback frame", {
  model: "haiku-4.5", effort: "LOW", cost: 3.1,
  rows: [
    { name: "Weekly", pct: 61, reset: "5d" },
    { name: "5-Hour", pct: 30, reset: "4h" },
    { name: "Context", pct: 45, reset: "—" },
  ],
}, { ascii: true });
