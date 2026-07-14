#!/usr/bin/env node
// Optional PostToolUse hook: turns each tool call into a transient RPG combat
// message that the statusline shows for a few seconds. Best-effort and silent —
// it only writes a small event file and never blocks the tool.

import { writeEvent } from "../lib/state.js";
import { combatMessage } from "../lib/hookmsg.js";

let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  try {
    const j = data.trim() ? JSON.parse(data) : {};
    const tool = j.tool_name || j.toolName || (j.tool && j.tool.name);
    const lang = process.env.CCRPG_LANG === "ja" ? "ja" : "en";
    if (tool) writeEvent(combatMessage(tool, lang), 3000);
  } catch {
    /* ignore */
  }
  process.exit(0);
});
process.stdin.on("error", () => process.exit(0));
