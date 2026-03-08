<!-- tested with: claude code v1.0.34 -->

---
name: sift
description: "(deprecated — use /miner instead) query your claude code usage history"
allowed-tools:
  - Bash
  - Read
---

# /sift

> **deprecated** — use `/miner` instead. `/miner` does everything `/sift` did and more, with natural language routing instead of subcommands.

## migration

| old command | new command |
|---|---|
| `/sift search <term>` | `/miner search <term>` |
| `/sift top tools` | `/miner top tools` |
| `/sift cost this month` | `/miner cost this month` |
| `/sift projects` | `/miner projects` |
| `/sift cache efficiency` | `/miner cache efficiency` |
| `/sift workflows` | `/miner workflows` |
| `/sift wasted` | `/miner wasted` |
| `/sift models` | `/miner models` |
| `/sift project <name>` | `/miner project <name>` |

## the prompt

`````
The user ran /sift. This command has been consolidated into /miner.

Tell the user: "/sift has been merged into /miner. just use /miner with whatever you want to know — it routes intelligently."

Then show the migration table:
- /sift search <term> → /miner search <term>
- /sift top tools → /miner top tools
- /sift cost this month → /miner cost this month
- /sift projects → /miner projects
- /sift cache efficiency → /miner cache efficiency
- /sift workflows → /miner workflows
- /sift wasted → /miner wasted
- /sift models → /miner models

If the user provided arguments (e.g., "/sift search websocket"), go ahead and execute it as if they had run /miner with those same arguments. Query ~/.claude/miner.db accordingly using sqlite3 -header -column.
`````
