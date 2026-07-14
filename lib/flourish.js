// RPG flourish: contextual battle messages derived purely from the view.
// A message is only produced when something actually needs attention, so the
// calm default state renders as exactly the mock (no trailer line).

import { THRESHOLDS } from "./color.js";

const MSG = {
  en: {
    inventoryFull: "INVENTORY FULL — run /compact to make room",
    depleted: (name) => `${name.toUpperCase()} DEPLETED — resting until reset`,
    danger: (name, pct) => `DANGER — ${name} at ${pct}%`,
    levelUp: (lv) => `LEVEL UP!  you are now Lv.${lv}`,
  },
  ja: {
    inventoryFull: "ふくろが いっぱいだ！ /compact で せいとんしよう",
    depleted: (name) => `${name} が つきた！ かいふくを まて`,
    danger: (name, pct) => `あぶない！ ${name} が ${pct}%`,
    levelUp: (lv) => `レベルアップ！ Lv.${lv} に なった！`,
  },
};

function pick(lang) {
  return MSG[lang] || MSG.en;
}

// Highest-priority single status message, or null when all is calm.
export function dangerMessage(view, lang = "en") {
  const t = pick(lang);
  const ctx = view.rows.find((r) => r.name === "Context");
  if (ctx && ctx.pct != null && ctx.pct >= 90) return t.inventoryFull;

  const depleted = view.rows.find((r) => r.pct != null && r.pct >= 100);
  if (depleted) return t.depleted(depleted.name);

  let worst = null;
  for (const r of view.rows) {
    if (r.pct != null && (worst == null || r.pct > worst.pct)) worst = r;
  }
  if (worst && worst.pct >= THRESHOLDS.danger) {
    return t.danger(worst.name, worst.pct);
  }
  return null;
}

export function levelUpMessage(lv, lang = "en") {
  return pick(lang).levelUp(lv);
}
