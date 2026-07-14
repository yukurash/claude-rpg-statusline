import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInput } from "../lib/render.js";

// Fixed clock so reset countdowns are deterministic.
const NOW = 1_000_000_000_000; // ms
const inHours = (h) => Math.floor(NOW / 1000) + h * 3600;
const inDays = (d) => Math.floor(NOW / 1000) + d * 86400;

test("maps a full Pro/Max payload into the view", () => {
  const raw = {
    model: { id: "claude-opus-4-8", display_name: "Opus" },
    effort: { level: "high" },
    cost: { total_cost_usd: 30.0456 },
    context_window: { used_percentage: 52.4 },
    rate_limits: {
      five_hour: { used_percentage: 91, resets_at: inHours(2) },
      seven_day: { used_percentage: 71, resets_at: inDays(3) },
    },
  };
  const v = parseInput(raw, { now: NOW });
  assert.equal(v.model, "opus-4.8");
  assert.equal(v.effort, "HIGH");
  assert.equal(v.cost, 30.0456);
  assert.deepEqual(
    v.rows.map((r) => [r.name, r.pct, r.reset]),
    [
      ["Weekly", 71, "3d"],
      ["5-Hour", 91, "2h"],
      ["Context", 52, "—"],
    ]
  );
});

test("missing rate_limits (free / API / cold start) falls back cleanly", () => {
  const raw = {
    model: { id: "claude-sonnet-5" },
    context_window: { used_percentage: 30 },
  };
  const v = parseInput(raw, { now: NOW });
  assert.equal(v.rows[0].pct, null); // Weekly unknown
  assert.equal(v.rows[0].reset, "--");
  assert.equal(v.rows[1].pct, null); // 5-Hour unknown
  assert.equal(v.rows[2].pct, 30); // Context always available
  assert.equal(v.effort, "—"); // no effort field
});

test("empty input never throws", () => {
  const v = parseInput({}, { now: NOW });
  assert.equal(v.rows.length, 3);
  assert.equal(v.cost, null);
});
