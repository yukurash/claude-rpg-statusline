#!/usr/bin/env node
// Register (or remove) claude-rpg-statusline in ~/.claude/settings.json.
//   node scripts/install.js                 -> install (RPG theme)
//   node scripts/install.js --theme plain   -> install without the game fiction
//   node scripts/install.js --uninstall
//
// Makes a timestamped backup and preserves every other setting.

import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { patchSettings, unpatchSettings } from "../lib/settings.js";

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(here, "..", "statusline.js");
const settingsDir = process.env.CCRPG_STATE_DIR || join(homedir(), ".claude");
const settingsPath = join(settingsDir, "settings.json");
const uninstall = process.argv.includes("--uninstall");
const themeIdx = process.argv.indexOf("--theme");
const theme = themeIdx !== -1 ? process.argv[themeIdx + 1] : null;
if (theme != null && !["rpg", "plain"].includes(theme)) {
  console.error(`Unknown theme "${theme}" — use rpg or plain.`);
  process.exit(1);
}

function readSettings() {
  try {
    return JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    return {};
  }
}

mkdirSync(settingsDir, { recursive: true });
if (existsSync(settingsPath)) {
  copyFileSync(settingsPath, settingsPath + ".bak-" + Date.now());
}

const current = readSettings();
const next = uninstall
  ? unpatchSettings(current)
  : patchSettings(current, scriptPath, theme && theme !== "rpg" ? { theme } : {});

writeFileSync(settingsPath, JSON.stringify(next, null, 2) + "\n", "utf8");

if (uninstall) {
  console.log(`✓ Removed claude-rpg-statusline from ${settingsPath}`);
} else {
  console.log(`✓ Installed claude-rpg-statusline into ${settingsPath}`);
  console.log(`  statusLine.command = ${next.statusLine.command}`);
  console.log("  Restart or interact with Claude Code to see it.");
}
