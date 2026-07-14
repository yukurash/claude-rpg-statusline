# claude-rpg-statusline

> Your Claude Code session as a Dragon-Quest-style status window.

A zero-dependency [statusline](https://code.claude.com/docs/en/statusline) for
Claude Code that renders your usage as a retro RPG HUD. Your weekly limit is
**HP**, the 5-hour limit is **MP**, the context window is your **BAG** — the
bars drain like real RPG meters, a `▶` cursor points at whichever stat is
closest to running out, and status ailments appear when things get dire.

```
╔════════════════════════════════════════════════╗
║ MODEL   opus-4.8                          Lv.7 ║
║ EFFORT  MAX                       GOLD  $12.40 ║
╟────────────┬──────────────────┬────────┬───────╢
║ RESOURCE   │       LIFE       │  LEFT  │RECOVER║
║ HP  Weekly │ ▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱ │ 59/100 │  3d   ║
║▶MP  5-Hour │ ▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱ │ 48/100 │  2h   ║
║ BAG Context│ ▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱ │ 67/100 │   —   ║
╚════════════╧══════════════════╧════════╧═══════╝
```

When a resource gets hot, ailment badges and battle lines appear:

```
║ EFFORT  MAX  [PSN][PAR]           GOLD  $30.05 ║
╟────────────┬──────────────────┬────────┬───────╢
║ RESOURCE   │       LIFE       │  LEFT  │RECOVER║
║ HP  Weekly │ ▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱ │ 18/100 │  2d   ║
║▶MP  5-Hour │ ▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱ │ 0/100  │  1h   ║
║ BAG Context│ ▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱ │ 7/100  │   —   ║
╚════════════╧══════════════════╧════════╧═══════╝
  ★ CRITICAL HIT!  code struck
  ⚠ INVENTORY FULL — run /compact to make room
```

## What it shows

| Field | Meaning |
| --- | --- |
| **MODEL** | Active model, e.g. `opus-4.8` |
| **EFFORT** | Reasoning effort (`MAX` / `HIGH` / `MED` / `LOW`) |
| **GOLD** | Cumulative session cost in USD (from `cost.total_cost_usd`) |
| **Lv.** | Character level from persistent EXP (needs the [combat-log hook](#optional-combat-log-hook-exp--levels)) |
| **HP** (Weekly) | 7-day rate limit — your long-term life bar |
| **MP** (5-Hour) | 5-hour rate limit — recovers much faster, like magic points |
| **BAG** (Context) | Context window — `/compact` empties the bag (no timed reset → `—`) |

Bars and the **LEFT** number show what *remains* and drain toward zero,
HP-style (`/usage` shows the used side; `used = 100 − LEFT`). Colors: green
(plenty left), yellow (< 40 left), red (< 15 left).

### Status ailments

| Badge | Ailment | Trigger |
| --- | --- | --- |
| `[PSN]` | Poison — slowly dying | BAG (context) ≥ 90% full |
| `[PAR]` | Paralysis — can't act | a rate limit is fully depleted |
| `[CRS]` | Curse — gold is draining | `MAX` effort with GOLD ≥ $10 |

## Install

Requires Node 18+.

```bash
git clone https://github.com/yukurash/claude-rpg-statusline
cd claude-rpg-statusline
npm run install-statusline     # patches ~/.claude/settings.json (with backup)
```

Then restart or interact with Claude Code. To remove it:

```bash
npm run uninstall-statusline
```

### Plain theme (no game fiction)

Prefer the same gauges without the RPG dressing? Install with:

```bash
npm run install-statusline -- --theme plain
```

```
┌────────────────────────────────────────────────┐
│ MODEL   opus-4.8                               │
│ EFFORT  MAX                       COST  $12.40 │
├────────────┬──────────────────┬────────┬───────┤
│ RESOURCE   │    REMAINING     │  LEFT  │ RESET │
│ Weekly     │ █████████░░░░░░░ │ 59/100 │  3d   │
│▶5-Hour     │ ████████░░░░░░░░ │ 48/100 │  2h   │
│ Context    │ ██████████░░░░░░ │ 67/100 │   —   │
└────────────┴──────────────────┴────────┴───────┘
  ⚠ 5-Hour running low — 9/100 left
```

Same layout and data, but: solid `█` bars in a single-line frame, `COST`
instead of `GOLD`, no HP/MP/BAG or level, no ailment badges, and factual
warnings ("5-Hour limit reached — waiting for reset") instead of battle lines.
Combat-log chatter and level-ups are hidden (EXP still accrues if the hook is
installed, so switching back later keeps your level). `CCRPG_THEME=plain|rpg`
overrides at runtime.

### Manual install

Add this to `~/.claude/settings.json` (adjust the path):

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/absolute/path/to/claude-rpg-statusline/statusline.js\"",
    "refreshInterval": 1
  }
}
```

`refreshInterval: 1` keeps the reset countdowns and level-up line fresh while the
session is idle.

## Configuration (environment variables)

| Variable | Effect |
| --- | --- |
| `CCRPG_THEME` | `rpg` (default) / `plain` — see [Plain theme](#plain-theme-no-game-fiction) |
| `CCRPG_COLOR` | `truecolor` / `256` / `none` (default: auto-detect) |
| `CCRPG_ASCII=1` | Use an ASCII frame (`+ - |`) for terminals that mangle box-drawing |
| `CCRPG_GAUGE` | Gauge style: `pips` (default `▰▱`) / `bars` (`█░`) / `orbs` (`◆◇`) / `dots` (`●○`) |
| `CCRPG_LANG=ja` | Japanese battle messages (`レベルアップ！`, `ふくろが いっぱいだ！`) |
| `CCRPG_STATE_DIR` | Override the state directory (default `~/.claude`) |
| `CCRPG_DEBUG=1` | Dump the raw stdin JSON to `~/.claude/ccrpg-debug-stdin.json` |

## Missing-data fallback

`rate_limits` (Weekly / 5-Hour) is only provided on Claude.ai Pro/Max plans and
only after the first API response of a session. When it is absent — free / API
usage, or the first few ticks — those rows show `--` and the cursor falls back to
**Context**, which is always available. The window never renders broken.

## Optional: combat-log hook (EXP & levels)

Enable a `PostToolUse` hook to turn each tool call into a transient combat line
(`★ CRITICAL HIT!`, `you cast SCRY`, `you summon an ALLY`, …). Add to your
settings, or install as a plugin using the bundled `.claude-plugin/plugin.json`
and `hooks/hooks.json`. It only writes a tiny event file (atomically) and never
blocks the tool.

With the hook installed your character also **gains EXP** per tool call —
editing code is worth more than looking around (`Edit` 5, `Task` 8, `Bash` 3,
web 2, reads 1) — and the level shows on the MODEL line. The curve is
quadratic (Lv.2 after ~5 edits, Lv.10 at 2025 EXP), levels persist across
sessions in `~/.claude/ccrpg-state.json`, and crossing a boundary announces
itself:

```
  ★ LEVEL UP!  you are now Lv.8
```

Unlike token-based scores, EXP is counted by the hook itself, so it stays
exact regardless of caching or payload quirks.

### Death & revival

When a rate limit fully depletes — and later comes back — the window marks the
moment:

```
  ★ THOU ART DEAD — 5-Hour is depleted
  ...
  ★ REVIVED!  5-Hour is restored — go forth, hero
```

## How it works

Claude Code pipes [session JSON on stdin](https://code.claude.com/docs/en/statusline)
to the `statusLine.command` on every turn. `statusline.js` reads
`model`, `effort.level`, `context_window.used_percentage`,
`cost.total_cost_usd` (GOLD), and `rate_limits.{five_hour,seven_day}`, then
renders the window. `render()` is a pure function and every line is width-checked
so the table can never drift. (Set `CCRPG_DEBUG=1` to dump the raw stdin JSON to
`~/.claude/ccrpg-debug-stdin.json` for inspection.)

```bash
npm test                 # unit tests (width invariant, fallbacks, messages)
npm run demo             # render the reference window
node scripts/demo-all.js # render several states
```

## Where this sits

There are already excellent statuslines — `ccstatusline` (powerline themes),
`claude-hud` (observability HUD), `ccusage` (cost/token reports), and pet-style
ones like Codachi. This one is unapologetically a *game window*: a fixed RPG
table with per-resource gauges, a spell-select cursor, and battle events. Overlap
is fine; it exists because it's fun to look at.

## License

MIT © yukurash
