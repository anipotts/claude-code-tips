# gifs

demo recordings using [VHS](https://github.com/charmbracelet/vhs) — declarative terminal recording via `.tape` files.

## setup

```bash
brew install vhs
```

## recording

record a single GIF:

```bash
vhs gifs/mine-stats.tape
```

record all priority GIFs:

```bash
for tape in gifs/*.tape; do vhs "$tape"; done
```

## priority GIFs

### mine-stats — `python3 scripts/mine.py --stats`

<img src="./mine-stats.gif" width="100%" alt="mine.py --stats dashboard" />

### sift-search — FTS5 full-text search

<img src="./sift-search.gif" width="100%" alt="FTS5 search across sessions" />

### query-cost — project spending

<img src="./query-cost.gif" width="100%" alt="project_costs VIEW" />

### query-daily — daily spending trend

<img src="./query-daily.gif" width="100%" alt="daily_costs VIEW" />

### hook-safety — blocking dangerous commands

<img src="./hook-safety.gif" width="100%" alt="safety-guard hook blocking force push" />

### mine-dryrun — first-run preview

<img src="./mine-dryrun.gif" width="100%" alt="mine.py --dry-run" />

## notes

- all tapes use Catppuccin Mocha theme + JetBrains Mono font
- most demos require a populated `~/.claude/miner.db` — run `python3 scripts/mine.py` first
- `.gif` outputs are committed to the repo; `.tape` source files are also committed
- 65 additional GIF ideas cataloged — start with these 6 priority demos
