# changelog

## 2026-03-15

### mine plugin
- renamed plugin: miner → mine
- renamed features: scar → mistakes
- removed: gauge (regex model advisor)
- added: burn cost-anomaly hook (fires on PreCompact)
- added: hotspots and loops query intents
- updated parser with user-centric metrics
- added 125-test suite (pytest)

### new tools
- live session dashboard (`scripts/dashboard.py`) — textual TUI
- replay capture hook + /replay command
- /dashboard slash command

### docs
- refreshed all 5 comparison docs with current pricing
- updated guide, cost analysis, troubleshooting, glossary

### CI
- fixed broken paths in docs-audit.yml and validate.yml
- added upstream-watcher PR permission docs
- added tests/ to python-check validation

### infra
- added handoff prompts for course structure and monetization
- added .gitleaks.toml for test fixture allowlisting

## 2026-03-08

### initial release
- mine plugin v1.0: search, mistakes, burn, hotspots, loops
- 19 docs covering beginner to advanced claude code patterns
- 9 slash commands, 8 agents
- 8 CI workflows for autonomous maintenance
- standalone hooks: safety-guard, panopticon, context-save, notify

<!-- tested with: claude code v2.1.77+ -->
