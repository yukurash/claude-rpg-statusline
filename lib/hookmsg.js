// Map a Claude Code tool name to a short RPG "combat log" line.

const EN = {
  edit: "CRITICAL HIT!  code struck",
  bash: "you swing your BLADE (Bash)",
  scan: "you scan the area",
  scry: "you cast SCRY",
  summon: "you summon an ALLY",
  use: (t) => `you use ${t}`,
};
const JA = {
  edit: "かいしんの いちげき！ コードを きった",
  bash: "ぶきで こうげき（Bash）",
  scan: "あたりを しらべた",
  scry: "スクライを となえた",
  summon: "なかまを よんだ",
  use: (t) => `${t} を つかった`,
};

// Classify a tool into an RPG action kind (shared with EXP awarding).
export function toolKind(toolName) {
  const t = String(toolName || "").toLowerCase();
  if (["edit", "write", "multiedit", "notebookedit"].includes(t)) return "edit";
  if (t === "bash") return "bash";
  if (["read", "glob", "grep", "ls"].includes(t)) return "scan";
  if (["webfetch", "websearch"].includes(t)) return "scry";
  if (t === "task") return "summon";
  return "use";
}

export function combatMessage(toolName, lang = "en") {
  const m = lang === "ja" ? JA : EN;
  const k = toolKind(toolName);
  return k === "use" ? m.use(toolName || "???") : m[k];
}
