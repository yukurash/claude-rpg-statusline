#!/usr/bin/env node
// Register (or remove) claude-rpg-statusline in ~/.claude/settings.json.
//   node scripts/install.js            -> install
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
  : patchSettings(current, scriptPath);

writeFileSync(settingsPath, JSON.stringify(next, null, 2) + "\n", "utf8");

if (uninstall) {
  console.log(`✓ Removed claude-rpg-statusline from ${settingsPath}`);
} else {
  console.log(`✓ Installed claude-rpg-statusline into ${settingsPath}`);
  console.log(`  statusLine.command = ${next.statusLine.command}`);
  console.log("  Restart or interact with Claude Code to see it.");
}
