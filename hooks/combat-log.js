#!/usr/bin/env node
// Optional PostToolUse hook: turns each tool call into a transient RPG combat
// message that the statusline shows for a few seconds. Best-effort and silent —
// it only writes a small event file and never blocks the tool.

import { writeEvent, readState, writeState } from "../lib/state.js";
import { combatMessage } from "../lib/hookmsg.js";
import { gainExp } from "../lib/level.js";
import { levelUpMessage } from "../lib/flourish.js";

let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  try {
    const j = data.trim() ? JSON.parse(data) : {};
    const tool = j.tool_name || j.toolName || (j.tool && j.tool.name);
    const lang = process.env.CCRPG_LANG === "ja" ? "ja" : "en";
    if (tool) {
      // Award EXP for the tool call; announce a level-up over the combat line.
      // (Read-modify-write can race the statusline's own writes; both sides
      // are best-effort and a lost point is invisible, so we don't lock.)
      const state = readState();
      const { exp, lv, leveled } = gainExp(state, tool);
      writeState({ ...state, exp });
      if (leveled) writeEvent(levelUpMessage(lv, lang), 6000, Date.now(), "levelup");
      else writeEvent(combatMessage(tool, lang), 3000, Date.now(), "combat");
    }
  } catch {
    /* ignore */
  }
  process.exit(0);
});
process.stdin.on("error", () => process.exit(0));
