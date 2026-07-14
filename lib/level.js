// Persistent character progression. EXP is counted by us (the combat-log hook
// awards points per tool call), so unlike token totals it can be exact — the
// statusline payload itself has no cumulative counter we could trust.

import { toolKind } from "./hookmsg.js";

// EXP per tool kind: creation > summoning allies > action > research > looking.
const EXP_BY_KIND = { edit: 5, summon: 8, bash: 3, scry: 2, scan: 1, use: 2 };

export function expForTool(toolName) {
  return EXP_BY_KIND[toolKind(toolName)] || EXP_BY_KIND.use;
}

// Quadratic curve: cumulative EXP needed for level n is 25·(n−1)².
// Lv.2 after ~5 edits, Lv.5 at 400 EXP, Lv.10 at 2025 EXP.
export function expForLevel(lv) {
  return 25 * (lv - 1) ** 2;
}

export function expToLevel(exp) {
  const e = Math.max(0, Number(exp) || 0);
  return Math.floor(Math.sqrt(e / 25)) + 1;
}

// Apply one tool call to the persisted state. Returns the new totals and
// whether a level boundary was crossed (so the hook can announce it).
export function gainExp(state, toolName) {
  const before = (state && state.exp) || 0;
  const exp = before + expForTool(toolName);
  const lv = expToLevel(exp);
  return { exp, lv, leveled: lv > expToLevel(before) };
}
