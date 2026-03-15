---
description: launch live session dashboard (textual TUI)
allowed-tools: Bash
---

Run the dashboard:
```bash
uvx --with textual python3 scripts/dashboard.py
```

If uvx is not available, fall back to: `pip install textual && python3 scripts/dashboard.py`

The dashboard reads from `~/.claude/mine.db`. If the DB doesn't exist, tell the user to run `/mine` first to populate it.
