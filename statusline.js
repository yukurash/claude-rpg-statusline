#!/usr/bin/env node
// Entry point wired into Claude Code's settings.json `statusLine.command`.
// Reads the statusline JSON on stdin, renders the RPG window, prints it.
// It must never crash the host statusline, so everything is wrapped defensively.

import { parseInput, render } from "./lib/render.js";
import { detectMode } from "./lib/color.js";
import { readFreshEvent, readState, writeState, writeEvent } from "./lib/state.js";
import { depletionTransition } from "./lib/flourish.js";

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
    // Theme: --theme plain / --theme=plain argv (baked in by the installer),
    // CCRPG_THEME env as override. Default is the RPG window.
    const argv = process.argv.slice(2);
    const flagIdx = argv.indexOf("--theme");
    const eqArg = argv.find((a) => a.startsWith("--theme="));
    const argTheme =
      (eqArg && eqArg.split("=")[1]) || (flagIdx !== -1 ? argv[flagIdx + 1] : null);
    const theme = (process.env.CCRPG_THEME || argTheme) === "plain" ? "plain" : "rpg";

    const state = readState(); // cross-tick memory: EXP, depletion flags
    const view = parseInput(raw, { now, env: process.env, state });

    // Death/revival transitions since the last tick become transient events
    // (written through the same channel as hook events, so the freshest wins).
    const trans = depletionTransition(state, view.rows, lang, theme);
    if (trans.msg) writeEvent(trans.msg, 6000, now, "transition");
    if (trans.changed) writeState({ ...state, depleted: trans.depleted });

    // Plain theme skips the game chatter (combat lines, level-ups) and only
    // surfaces limit transitions.
    const ev = readFreshEvent(now);
    const event =
      ev && (theme !== "plain" || ev.kind === "transition") ? ev.msg : null;

    const GAUGES = {
      pips: ["▰", "▱"],
      bars: ["█", "░"],
      orbs: ["◆", "◇"],
      dots: ["●", "○"],
    };
    const glyphs =
      GAUGES[process.env.CCRPG_GAUGE] ||
      (theme === "plain" ? GAUGES.bars : GAUGES.pips);

    const out = render(view, {
      mode: detectMode(process.env),
      ascii: process.env.CCRPG_ASCII === "1",
      lang,
      theme,
      event,
      glyphs,
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
