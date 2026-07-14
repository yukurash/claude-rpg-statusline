import { test } from "node:test";
import assert from "node:assert/strict";
import { dangerMessage } from "../lib/flourish.js";
import { render } from "../lib/render.js";

const rows = (w, f, c) => [
  { name: "Weekly", pct: w, reset: "3d" },
  { name: "5-Hour", pct: f, reset: "2h" },
  { name: "Context", pct: c, reset: "—" },
];
const view = (w, f, c) => ({ model: "opus-4.8", effort: "MAX", cost: 1.23, rows: rows(w, f, c) });

test("calm state produces no message", () => {
  assert.equal(dangerMessage(view(40, 50, 30)), null);
});

test("context >= 90% takes priority (inventory full)", () => {
  assert.match(dangerMessage(view(95, 99, 92)), /INVENTORY FULL/);
});

test("a depleted resource is called out", () => {
  assert.match(dangerMessage(view(40, 100, 50)), /5-HOUR DEPLETED/);
});

test("danger threshold at 85% otherwise", () => {
  assert.match(dangerMessage(view(88, 50, 30)), /DANGER — Weekly at 88%/);
});

test("japanese messages available", () => {
  assert.match(dangerMessage(view(40, 100, 50), "ja"), /つきた/);
});

test("calm render is exactly 8 lines; danger render appends a trailer", () => {
  assert.equal(render(view(40, 50, 30), { mode: "none" }).split("\n").length, 8);
  const dangerOut = render(view(40, 91, 30), { mode: "none" }).split("\n");
  assert.equal(dangerOut.length, 9);
  assert.match(dangerOut[8], /⚠/);
});

test("event line is rendered above the danger line", () => {
  const out = render(view(40, 91, 30), { mode: "none", event: "CRITICAL HIT!  code struck" }).split("\n");
  assert.equal(out.length, 10);
  assert.match(out[8], /★.*CRITICAL HIT/);
  assert.match(out[9], /⚠/);
});
