// RPG flourish: contextual battle messages derived purely from the view.
// A message is only produced when something actually needs attention, so the
// calm default state renders as exactly the mock (no trailer line).

import { THRESHOLDS } from "./color.js";

const MSG = {
  en: {
    inventoryFull: "INVENTORY FULL — run /compact to make room",
    depleted: (name) => `${name.toUpperCase()} DEPLETED — resting until reset`,
    danger: (name, pct) => `DANGER — ${name} down to ${100 - pct}/100`,
    levelUp: (lv) => `LEVEL UP!  you are now Lv.${lv}`,
    died: (name) => `THOU ART DEAD — ${name} is depleted`,
    revived: (name) => `REVIVED!  ${name} is restored — go forth, hero`,
  },
  ja: {
    inventoryFull: "ふくろが いっぱいだ！ /compact で せいとんしよう",
    depleted: (name) => `${name} が つきた！ かいふくを まて`,
    danger: (name, pct) => `あぶない！ ${name} は のこり ${100 - pct}`,
    levelUp: (lv) => `レベルアップ！ Lv.${lv} に なった！`,
  },
};

// Missing keys in a translation fall back to English.
function pick(lang) {
  return { ...MSG.en, ...(MSG[lang] || {}) };
}

export function levelUpMessage(lv, lang = "en") {
  return pick(lang).levelUp(lv);
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

// Compare this tick's rows against the depletion flags remembered from the
// last tick and detect death (a resource just hit 100) and revival (a
// previously dead resource is back below 100). An unknown pct keeps the old
// flag: losing rate-limit data is not a resurrection. Returns the flags to
// persist, a transient message (revival wins over death — it has no other
// signal, death also gets the persistent DEPLETED line), and whether the
// flags changed so callers only write state when needed.
export function depletionTransition(state, rows, lang = "en") {
  const t = pick(lang);
  const prev = (state && state.depleted) || {};
  const depleted = {};
  let died = null;
  let revived = null;
  for (const r of rows) {
    if (r.pct != null && r.pct >= 100) {
      depleted[r.name] = true;
      if (!prev[r.name]) died = r.name;
    } else if (prev[r.name]) {
      if (r.pct != null) revived = r.name;
      else depleted[r.name] = true;
    }
  }
  const msg = revived ? t.revived(revived) : died ? t.died(died) : null;
  const changed =
    Object.keys(depleted).sort().join() !== Object.keys(prev).sort().join();
  return { depleted, msg, changed };
}
