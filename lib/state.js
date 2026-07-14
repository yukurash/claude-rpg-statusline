// Tiny JSON state store under ~/.claude for cross-tick memory (session level,
// last event). Best-effort: any IO failure degrades to "no memory", never
// throws, so it can't break the statusline.

import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";

export function stateDir() {
  return process.env.CCRPG_STATE_DIR || join(homedir(), ".claude");
}

function statePath() {
  return join(stateDir(), "ccrpg-state.json");
}

export function readState() {
  try {
    return JSON.parse(readFileSync(statePath(), "utf8"));
  } catch {
    return {};
  }
}

export function writeState(obj) {
  try {
    const dir = stateDir();
    mkdirSync(dir, { recursive: true });
    const tmp = statePath() + "." + process.pid + ".tmp";
    writeFileSync(tmp, JSON.stringify(obj), "utf8");
    renameSync(tmp, statePath()); // atomic swap
  } catch {
    /* ignore: memory is a nice-to-have */
  }
}

// Write a transient event (consumed by the statusline within its ttl).
export function writeEvent(msg, ttlMs = 4000, nowMs = Date.now()) {
  try {
    const dir = stateDir();
    mkdirSync(dir, { recursive: true });
    const p = join(dir, "ccrpg-events.json");
    const tmp = p + "." + process.pid + ".tmp";
    writeFileSync(tmp, JSON.stringify({ ts: nowMs, msg, ttlMs }), "utf8");
    renameSync(tmp, p); // atomic swap avoids torn reads / hook races
  } catch {
    /* ignore */
  }
}

// Read a fresh event written by a hook (ccrpg-events.json = {ts, msg, ttlMs}).
export function readFreshEvent(nowMs = Date.now()) {
  try {
    const p = join(stateDir(), "ccrpg-events.json");
    const e = JSON.parse(readFileSync(p, "utf8"));
    if (e && e.msg && nowMs - e.ts <= (e.ttlMs || 4000)) return e.msg;
  } catch {
    /* no event */
  }
  return null;
}
