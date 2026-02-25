# knowledge-builder

PostToolUse hook that builds a knowledge graph in `.claude/knowledge.md` as Claude explores your codebase. tracks which files exist, what type they are (source, test, config, entry point), and how they relate through imports.

credit: Boris Cherny tip #6 (knowledge graphs).

## what it tracks

- files discovered via Read, Grep, and Glob calls
- import/export relationships (JS/TS `import from`, `require()`, Python `import`)
- file classification (source, test, config, entry point)
- first-seen timestamps

## what you get

```markdown
# knowledge graph

## files discovered

| file | type | first seen |
|---|---|---|
| lib/auth.ts | source | 2026-02-25 14:32 |
| lib/auth.test.ts | test | 2026-02-25 14:33 |
| lib/index.ts | entry | 2026-02-25 14:34 |

## relationships

- `lib/auth.ts -> ./token`
- `lib/auth.ts -> ./session`
- `lib/index.ts -> ./auth`
```

## install

copy the hook script:

```bash
mkdir -p ~/.claude/hooks
cp hooks/knowledge-builder/knowledge-builder.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/knowledge-builder.sh
```

add to your `~/.claude/settings.json` (or `.claude/settings.json` for project-level):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Read|Grep|Glob",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/knowledge-builder.sh"
          }
        ]
      }
    ]
  }
}
```

## requirements

- `jq` (for parsing hook JSON payloads)
- `sed`, `grep` (standard unix tools)
- a `.claude/` directory in your project (created automatically)

## usage

just use claude code normally. the knowledge graph builds itself as claude reads and searches your files.

view it:

```bash
cat .claude/knowledge.md
```

reset it:

```bash
rm .claude/knowledge.md
```

## notes

- the hook is lightweight -- adds a few ms per tool call at most
- only tracks source files (ts, js, py, rs, go, rb, java, vue, svelte), not markdown or config files
- skips node_modules, .git, dist, build, and other generated directories
- the knowledge file grows as claude explores. delete it to start fresh
- works best on multi-session projects where you want claude to build a picture of the codebase over time
- add `.claude/knowledge.md` to `.gitignore` if you don't want it committed
- pair with the `/improve` skill to turn discovered patterns into CLAUDE.md rules
