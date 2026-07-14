# claude-rpg-statusline

> Your Claude Code session as a Dragon-Quest-style status window.

A zero-dependency [statusline](https://code.claude.com/docs/en/statusline) for
Claude Code that renders your usage as a retro RPG HUD. Weekly / 5-hour /
context gauges, model, effort and cumulative cost (`GOLD`), with a `▶` cursor
that automatically points at whichever resource is closest to its limit.

```
╔════════════════════════════════════════════════╗
║ MODEL   opus-4.8                               ║
║ EFFORT  MAX                       GOLD  $12.40 ║
╟────────────┬──────────────────┬────────┬───────╢
║ Weekly     │ ███████░░░░░░░░░ │ 41/100 │  3d   ║
║▶5-Hour     │ ████████░░░░░░░░ │ 52/100 │  2h   ║
║ Context    │ █████░░░░░░░░░░░ │ 33/100 │   —   ║
╚════════════╧══════════════════╧════════╧═══════╝
```

When a resource gets hot, a battle line appears below the window:

```
║▶5-Hour     │ ████████████████ │100/100 │  1h   ║
║ Context    │ ███████████████░ │ 93/100 │   —   ║
╚════════════╧══════════════════╧════════╧═══════╝
  ★ CRITICAL HIT!  code struck
  ⚠ INVENTORY FULL — run /compact to make room
```

## What it shows

| Column | Meaning |
| --- | --- |
| **MODEL** | Active model, e.g. `opus-4.8` |
| **EFFORT** | Reasoning effort (`MAX` / `HIGH` / `MED` / `LOW`) |
| **GOLD** | Cumulative session cost in USD (from `cost.total_cost_usd`) |
| **Weekly** | 7-day rate-limit usage `used/100`, with reset countdown |
| **5-Hour** | 5-hour rate-limit usage `used/100`, with reset countdown |
| **Context** | Context-window usage (no timed reset → `—`) |

Gauges always show **usage** (so the numbers match `/usage`); the filled `█` is
used and the empty `░` is the head-room you have left. Colors: green (≤60%),
yellow (60–85%), red (≥85%).

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

## Optional: combat-log hook

Enable a `PostToolUse` hook to turn each tool call into a transient combat line
(`★ CRITICAL HIT!`, `you cast SCRY`, `you summon an ALLY`, …). Add to your
settings, or install as a plugin using the bundled `.claude-plugin/plugin.json`
and `hooks/hooks.json`. It only writes a tiny event file (atomically) and never
blocks the tool.

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
