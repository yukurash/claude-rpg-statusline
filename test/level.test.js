import { test } from "node:test";
import assert from "node:assert/strict";
import { expToLevel, expForLevel, expForTool, gainExp } from "../lib/level.js";

test("level curve: quadratic thresholds", () => {
  assert.equal(expToLevel(0), 1);
  assert.equal(expToLevel(24), 1);
  assert.equal(expToLevel(25), 2); // 5 edits
  assert.equal(expToLevel(99), 2);
  assert.equal(expToLevel(100), 3);
  assert.equal(expToLevel(2025), 10);
  // expForLevel is the exact inverse boundary.
  for (const lv of [2, 3, 5, 10, 20]) {
    assert.equal(expToLevel(expForLevel(lv)), lv);
    assert.equal(expToLevel(expForLevel(lv) - 1), lv - 1);
  }
});

test("garbage exp never breaks the level", () => {
  assert.equal(expToLevel(null), 1);
  assert.equal(expToLevel(-50), 1);
  assert.equal(expToLevel("not a number"), 1);
});

test("tools award kind-based EXP", () => {
  assert.equal(expForTool("Edit"), 5);
  assert.equal(expForTool("Write"), 5);
  assert.equal(expForTool("Task"), 8);
  assert.equal(expForTool("Bash"), 3);
  assert.equal(expForTool("WebSearch"), 2);
  assert.equal(expForTool("Grep"), 1);
  assert.equal(expForTool("SomeMcpTool"), 2); // default
});

test("gainExp accumulates and reports level-ups exactly once", () => {
  // 20 EXP -> one Edit (+5) crosses the Lv.2 boundary at 25.
  const up = gainExp({ exp: 20 }, "Edit");
  assert.deepEqual(up, { exp: 25, lv: 2, leveled: true });
  // The next call stays within Lv.2.
  const flat = gainExp({ exp: up.exp }, "Grep");
  assert.equal(flat.leveled, false);
  assert.equal(flat.lv, 2);
  // Empty state starts from zero.
  assert.deepEqual(gainExp({}, "Bash"), { exp: 3, lv: 1, leveled: false });
});
