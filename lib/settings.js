// Pure helper for patching a Claude Code settings object to (de)register the
// statusline. Kept separate from disk IO so it can be unit-tested.

export function statusLineCommand(absScriptPath) {
  // Quote the path so spaces (e.g. "Program Files") don't break the shell.
  return `node "${absScriptPath}"`;
}

export function patchSettings(settings, absScriptPath, opts = {}) {
  const next = { ...(settings || {}) };
  next.statusLine = {
    type: "command",
    command: statusLineCommand(absScriptPath),
    // Time-based data (reset countdowns, level-up) needs periodic refresh.
    refreshInterval: opts.refreshInterval ?? 1,
    padding: opts.padding ?? 0,
  };
  return next;
}

export function unpatchSettings(settings) {
  const next = { ...(settings || {}) };
  delete next.statusLine;
  return next;
}
