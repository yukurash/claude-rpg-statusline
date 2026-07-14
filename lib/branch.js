// Resolve the current git branch by reading .git/HEAD directly — no `git`
// process per tick (the statusline refreshes every second). Handles regular
// repos, worktrees/submodules (.git as a "gitdir: ..." file) and detached
// HEAD (short sha). Returns null when not in a repo or on any error.

import { readFileSync, statSync } from "node:fs";
import { join, dirname, resolve, isAbsolute } from "node:path";

export function gitBranch(startDir) {
  try {
    if (!startDir) return null;
    let dir = resolve(String(startDir));
    for (let depth = 0; depth < 50; depth++) {
      const dotGit = join(dir, ".git");
      let st = null;
      try {
        st = statSync(dotGit);
      } catch {
        /* keep walking up */
      }
      if (st) {
        let gitDir = dotGit;
        if (st.isFile()) {
          const m = /^gitdir:\s*(.+)\s*$/m.exec(readFileSync(dotGit, "utf8"));
          if (!m) return null;
          const target = m[1].trim();
          gitDir = isAbsolute(target) ? target : join(dir, target);
        }
        const head = readFileSync(join(gitDir, "HEAD"), "utf8").trim();
        const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(head);
        if (ref) return ref[1];
        return /^[0-9a-f]{40}$/.test(head) ? head.slice(0, 7) : null;
      }
      const parent = dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  } catch {
    /* fall through */
  }
  return null;
}
