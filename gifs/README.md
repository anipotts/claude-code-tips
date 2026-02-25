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

| tape file | output | what it shows |
|---|---|---|
| `mine-stats.tape` | `mine-stats.gif` | `--stats` dashboard with cost breakdown |
| `sift-search.tape` | `sift-search.gif` | FTS5 full-text search across sessions |
| `query-cost.tape` | `query-cost.gif` | project_costs VIEW — spending by project |
| `query-daily.tape` | `query-daily.gif` | daily_costs VIEW — spending trend |
| `hook-safety.tape` | `hook-safety.gif` | safety-guard blocking a dangerous command |
| `plugin-install.tape` | `plugin-install.gif` | `claude plugin add anipotts/miner` |

## notes

- all tapes use Catppuccin Mocha theme + JetBrains Mono font
- most demos require a populated `~/.claude/miner.db` — run `python3 scripts/mine.py` first
- `.gif` outputs are committed to the repo; `.tape` source files are also committed
- 65 additional GIF ideas cataloged — start with these 6 priority demos
