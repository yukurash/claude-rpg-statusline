import { test } from "node:test";
import assert from "node:assert/strict";
import { dangerMessage, depletionTransition, levelUpMessage } from "../lib/flourish.js";
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
  assert.match(dangerMessage(view(88, 50, 30)), /DANGER — Weekly down to 12\/100/);
});

test("japanese messages available", () => {
  assert.match(dangerMessage(view(40, 100, 50), "ja"), /つきた/);
});

test("ja falls back to english for untranslated messages", () => {
  const dead = depletionTransition({}, rows(40, 100, 50), "ja");
  assert.match(dead.msg, /THOU ART DEAD/);
  assert.match(levelUpMessage(3, "ja"), /レベルアップ/);
});

test("depletion transition: death, then silence, then revival", () => {
  const dead = depletionTransition({}, rows(40, 100, 50));
  assert.match(dead.msg, /THOU ART DEAD — 5-Hour/);
  assert.ok(dead.changed);
  // Same state next tick: no repeated message, nothing to persist.
  const still = depletionTransition({ depleted: dead.depleted }, rows(40, 100, 50));
  assert.equal(still.msg, null);
  assert.ok(!still.changed);
  // The limit resets: revival announcement.
  const back = depletionTransition({ depleted: dead.depleted }, rows(40, 5, 50));
  assert.match(back.msg, /REVIVED! {2}5-Hour/);
  assert.ok(back.changed);
});

test("losing rate-limit data is not a resurrection", () => {
  const dead = depletionTransition({}, rows(40, 100, 50));
  const unknown = depletionTransition({ depleted: dead.depleted }, rows(40, null, 50));
  assert.equal(unknown.msg, null);
  assert.ok(!unknown.changed, "flag survives an unknown tick");
});

test("calm render is exactly 9 lines; danger render appends a trailer", () => {
  assert.equal(render(view(40, 50, 30), { mode: "none" }).split("\n").length, 9);
  const dangerOut = render(view(40, 91, 30), { mode: "none" }).split("\n");
  assert.equal(dangerOut.length, 10);
  assert.match(dangerOut[9], /⚠/);
});

test("event line is rendered above the danger line", () => {
  const out = render(view(40, 91, 30), { mode: "none", event: "CRITICAL HIT!  code struck" }).split("\n");
  assert.equal(out.length, 11);
  assert.match(out[9], /★.*CRITICAL HIT/);
  assert.match(out[10], /⚠/);
});
