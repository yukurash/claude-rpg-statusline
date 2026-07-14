import { test } from "node:test";
import assert from "node:assert/strict";
import { patchSettings, unpatchSettings, statusLineCommand } from "../lib/settings.js";
import { combatMessage } from "../lib/hookmsg.js";

test("patchSettings adds a statusLine and preserves other keys", () => {
  const before = { theme: "dark", permissions: { allow: ["x"] } };
  const after = patchSettings(before, "/path/to/statusline.js");
  assert.equal(after.theme, "dark");
  assert.deepEqual(after.permissions, before.permissions);
  assert.equal(after.statusLine.type, "command");
  assert.equal(after.statusLine.refreshInterval, 1);
  assert.match(after.statusLine.command, /statusline\.js/);
  assert.ok(before.statusLine === undefined, "input not mutated");
});

test("statusLineCommand quotes the path for spaces", () => {
  assert.equal(
    statusLineCommand("C:/Program Files/x/statusline.js"),
    'node "C:/Program Files/x/statusline.js"'
  );
});

test("theme flag is baked into the command only when given", () => {
  assert.equal(
    statusLineCommand("/x/statusline.js", "plain"),
    'node "/x/statusline.js" --theme plain'
  );
  const after = patchSettings({}, "/x/statusline.js", { theme: "plain" });
  assert.match(after.statusLine.command, /--theme plain$/);
  const plainless = patchSettings({}, "/x/statusline.js");
  assert.ok(!plainless.statusLine.command.includes("--theme"));
});

test("unpatchSettings removes only the statusLine", () => {
  const s = patchSettings({ theme: "dark" }, "/x.js");
  const out = unpatchSettings(s);
  assert.equal(out.statusLine, undefined);
  assert.equal(out.theme, "dark");
});

test("combatMessage maps tools to RPG lines", () => {
  assert.match(combatMessage("Edit"), /CRITICAL HIT/);
  assert.match(combatMessage("Bash"), /BLADE/);
  assert.match(combatMessage("Task"), /ALLY/);
  assert.match(combatMessage("Grep"), /scan/);
  assert.match(combatMessage("Frobnicate"), /Frobnicate/);
  assert.match(combatMessage("Edit", "ja"), /かいしん/);
});
