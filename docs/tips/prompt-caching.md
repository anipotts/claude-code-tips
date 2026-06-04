<!-- tested with: claude code v2.1.122 -->

# prompt caching

the single biggest cost lever in claude code. my overall cache hit rate is 95%. here's why.

## how it works

claude code caches your system prompt, tool definitions, and CLAUDE.md as a prefix. when these stay the same across turns, 90% of input tokens hit the cache, meaning you pay 1/10th the cost on those tokens.

## the trick

keep your CLAUDE.md **short and stable**. every edit breaks the prefix cache for that session.

```markdown
# my-project

## structure
- src/ -- application code
- tests/ -- test files

## conventions
- typescript strict mode
- vitest for testing
- never use `any`
```

that's it. 10-20 lines. project structure, conventions, hard rules. no prose, no philosophy.

## what kills your cache

- editing CLAUDE.md mid-session (cache invalidated immediately)
- very long CLAUDE.md files (more content = more to re-cache on changes)
- switching models mid-session (different cache prefix)

## real numbers

from real session data:

| session length | cache hit rate | avg cost |
|---------------|---------------|----------|
| <10 min | 83% | $1.96 |
| 10-30 min | 91% | $5.59 |
| 30-60 min | 95% | $10.92 |
| 1-2 hr | 96% | $16.74 |
| 2 hr+ | 96% | $27.72 |

longer sessions cache better bc the prefix stabilizes and cache_write amortizes over more turns. short sessions spend proportionally more on initial cache creation.



### cache performance with hook proliferation (v2.1.162+)

with more hooks firing on more events (PostToolBatch, UserPromptExpansion, MessageDisplay), the system prompt expands to include more hook definitions. this can reduce cache efficiency if you have many hooks registered.

mitigations:
- disable unused hooks in `.claude/settings.json`
- consolidate multiple small hooks into one larger command hook
- use `mcp_tool` handlers instead of spawning subprocesses (no system prompt expansion)

## try it

1. check your current CLAUDE.md. is it under 30 lines?
2. move anything that changes frequently (task lists, WIP notes) to a separate file
3. run `/mine` to check your cache hit rate after a few sessions

[full cost breakdown &rarr;](../cost.md)
