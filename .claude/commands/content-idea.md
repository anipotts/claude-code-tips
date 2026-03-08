# Capture Content Idea

Quickly capture a content idea from this project and add it to the central content queue.

## Usage
```
/content-idea "<description of the idea>"
```

**Examples:**
```
/content-idea "just built a streaming draft system, shows real-time AI responses"
/content-idea "discovered a Claude Code trick for multi-file edits that saves 10 min"
/content-idea "production bug story: agent retry loop ate 50k tokens before we caught it"
```

## Instructions

1. Take the description provided by the user

2. Determine which series type fits best:
   - **agent-tip** — Claude Code tips, commands, workflows (30-60s video)
   - **build-log** — Project deep-dives, technical builds (long-form article + video)
   - **stack-drop** — Quick text-first tips about tools/stack (tweet/thread)
   - **founders-log** — Startup building, daily work, decisions (text or short video)
   - **viral-reel** — Eye-catching demo, wow moment (<30s video)

3. Determine if it's a script (short-form/reel) or pillar (long-form):
   - Short, visual, demo-able → Script Backlog
   - Deep, technical, multi-step → Pillar Backlog

4. Append a row to `~/Content/ideas.md` in the appropriate table:

   For Script Backlog:
   ```
   | idea | <title/hook from description> | <series-type> | From [project-name]: <brief context> |
   ```

   For Pillar Backlog:
   ```
   | idea | <topic from description> | <series-type> | From [project-name]: <brief context> |
   ```

   Where [project-name] is the name of the current repo/project.

5. Confirm to the user:

```
## Idea Captured

**Added to:** ~/Content/ideas.md ([Script/Pillar] Backlog)
**Series:** [series-type]
**Title:** [title/hook]

To start drafting: `cd ~/Content && /draft` or `/new-content`
```

## Notes

- This command is designed to work from ANY project repo
- It writes to ~/Content/ideas.md which is the central content queue
- The user can later promote ideas to drafts from ~/Content
- Keep the title/hook punchy — it should suggest the content angle
- Always include the source project name in the Notes column
