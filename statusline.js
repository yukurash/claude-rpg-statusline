#!/usr/bin/env node
// Entry point wired into Claude Code's settings.json `statusLine.command`.
// Reads the statusline JSON on stdin, renders the RPG window, prints it.
// It must never crash the host statusline, so everything is wrapped defensively.

import { parseInput, render } from "./lib/render.js";
import { detectMode } from "./lib/color.js";
import { readFreshEvent } from "./lib/state.js";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) return resolve(""); // no piped input
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

async function main() {
  let raw = {};
  try {
    const text = await readStdin();
    if (process.env.CCRPG_DEBUG === "1") {
      try {
        const os = await import("node:os");
        const fs = await import("node:fs");
        fs.writeFileSync(os.homedir() + "/.claude/ccrpg-debug-stdin.json", text || "", "utf8");
      } catch {}
    }
    if (text.trim()) raw = JSON.parse(text);
  } catch {
    raw = {};
  }

  try {
    const now = Date.now();
    const lang = process.env.CCRPG_LANG === "ja" ? "ja" : "en";
    const view = parseInput(raw, { now, env: process.env });
    const event = readFreshEvent(now); // optional hook-written event

    const out = render(view, {
      mode: detectMode(process.env),
      ascii: process.env.CCRPG_ASCII === "1",
      lang,
      event,
    });
    process.stdout.write(out + "\n");
  } catch (err) {
    // Last-resort single line so the statusline area is never blank/broken.
    const model =
      (raw && raw.model && (raw.model.display_name || raw.model.id)) || "claude";
    process.stdout.write(`[claude-rpg-statusline] ${model} (render error)\n`);
  }
}

main();
