import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gitBranch } from "../lib/branch.js";

function repo(headContent, dotGitFile = null) {
  const root = mkdtempSync(join(tmpdir(), "ccrpg-branch-"));
  if (dotGitFile) {
    // Worktree/submodule style: .git is a file pointing at the real git dir.
    const real = join(root, "real-git-dir");
    mkdirSync(real, { recursive: true });
    writeFileSync(join(real, "HEAD"), headContent, "utf8");
    writeFileSync(join(root, ".git"), `gitdir: ${real}\n`, "utf8");
  } else {
    mkdirSync(join(root, ".git"), { recursive: true });
    writeFileSync(join(root, ".git", "HEAD"), headContent, "utf8");
  }
  return root;
}

test("reads the branch from .git/HEAD, walking up from a subdir", (t) => {
  const root = repo("ref: refs/heads/feat/branch-line\n");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(gitBranch(root), "feat/branch-line");
  const deep = join(root, "src", "lib");
  mkdirSync(deep, { recursive: true });
  assert.equal(gitBranch(deep), "feat/branch-line");
});

test("worktree-style .git file is followed", (t) => {
  const root = repo("ref: refs/heads/main\n", true);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(gitBranch(root), "main");
});

test("detached HEAD falls back to a short sha", (t) => {
  const root = repo("0123456789abcdef0123456789abcdef01234567\n");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(gitBranch(root), "0123456");
});

test("outside a repo / bad input returns null", (t) => {
  const root = mkdtempSync(join(tmpdir(), "ccrpg-norepo-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(gitBranch(root), null);
  assert.equal(gitBranch(null), null);
  assert.equal(gitBranch(""), null);
  assert.equal(gitBranch(join(root, "does", "not", "exist")), null);
});
