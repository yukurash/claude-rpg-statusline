# claude-rpg-statusline

> Your Claude Code session as a Dragon-Quest-style status window.

A zero-dependency [statusline](https://code.claude.com/docs/en/statusline) for
Claude Code that renders your usage as a retro RPG HUD — weekly / 5-hour /
context gauges, model, effort and spent tokens, with a `▶` cursor that points at
whichever resource is closest to its limit.

```
╔════════════════════════════════════════════════╗
║ MODEL   opus-4.8                          Lv.7 ║
║ EFFORT  MAX                     GOLD  47.2k tok ║
╟────────────┬──────────────────┬────────┬───────╢
║ Weekly     │ ███████████░░░░░  │ 71/100 │  3d   ║
║▶5-Hour     │ ███████████████░  │ 91/100 │  2h   ║
║ Context    │ ████████░░░░░░░░  │ 52/100 │   —   ║
╚════════════╧══════════════════╧════════╧═══════╝
```

Status: **early scaffold — implementation in progress.** See
[the plan](#roadmap) below.

## Roadmap
- [ ] Rendering core (fixed-width RPG table, gauges, cursor)
- [ ] Color modes (truecolor / 256 / none) + themes
- [ ] Missing-data fallback (free / API / cold start)
- [ ] RPG flourish (job class, Lv + EXP, hook-driven events)
- [ ] Plugin packaging + install docs
- [ ] Screenshots / demo gif

## License
MIT © yukurash
