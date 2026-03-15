# course structure: claude-code-tips → paid course

you are building a 4-tier course from the claude-code-tips repo. this file is your complete brief — read it, then start building.

## repo context

the repo at `/Users/anipotts/Code/active/claude-code-tips` contains:

- **19 docs** in `docs/` — beginner guide, hooks reference, subagent patterns, agent teams, automation, cli tools, plugin creation, mcp servers, cost analysis, troubleshooting, glossary, resources, upstream watcher design, and 5 comparison docs
- **9 slash commands** in `.claude/commands/` — mine, improve, ship, sweep, quicktest, stats, deps, sift, ledger
- **8 agents** in `.claude/agents/` — analyst, explorer, guardian, code-sweeper, dep-checker, pr-narrator, test-writer, vibe-check
- **mine plugin** in `plugins/mine/` — 7 hooks + parser + schema, features: search, mistakes, burn, hotspots, loops
- **dashboard** via `scripts/dashboard.py`
- **replay system** via `hooks/replay-capture.sh`
- **standalone hooks** in `hooks/` — safety-guard, panopticon, context-save, notify, knowledge-builder

read `CLAUDE.md` for conventions. read `README.md` for the full inventory. output all course content to `content/` (gitignored).

---

## content inventory

### docs → lesson mapping

| doc | topic | level | tier |
|-----|-------|-------|------|
| guide.md | beginner-to-advanced overview | beginner | free |
| hooks-guide.md | complete hooks reference | intermediate | core |
| subagent-patterns.md | multi-agent architecture | advanced | core/pro |
| agent-teams.md | parallel worktree agents | advanced | pro |
| automation.md | daemon/cron patterns | advanced | pro |
| cli-tools.md | headless claude code | intermediate | core |
| plugin-creation.md | building plugins | advanced | pro |
| mcp-servers.md | MCP integration | intermediate | core |
| cost-analysis.md | token economics | beginner | free/core |
| troubleshooting.md | common problems | beginner | free |
| glossary.md | terminology | beginner | free |
| resources.md | curated links | beginner | free |
| upstream-watcher-design.md | autonomous CI | advanced | pro |
| comparisons/antigravity.md | vs antigravity | beginner | free |
| comparisons/codex.md | vs codex | beginner | free |
| comparisons/cursor.md | vs cursor | beginner | free |
| comparisons/gemini.md | vs gemini | beginner | free |
| comparisons/pricing.md | pricing comparison | beginner | free |

### other assets

- 9 slash commands (mine is the primary, others are workflow-specific)
- 8 agents (each is a self-contained .md prompt)
- mine plugin: 7 hooks (startup, compact, ingest, mistakes, burn, subagent, tool-log) + mine.py parser + schema.sql
- dashboard.py (terminal dashboard from mine.db)
- replay-capture.sh (session replay system)

---

## 4-tier structure

### free tier: "claude code in 7 lessons" (95% exists)

target: developers who've heard of claude code but haven't used it seriously. zero to productive.

| # | lesson | source | status |
|---|--------|--------|--------|
| 1 | what claude code actually is | guide.md intro + beginner section | edit only |
| 2 | your first session | guide.md beginner (install, CLAUDE.md, first task) | edit only |
| 3 | understanding costs | cost-analysis.md | edit only |
| 4 | common problems solved | troubleshooting.md | edit only |
| 5 | how it compares | comparisons/*.md (synthesize into one lesson) | light editing |
| 6 | key terms | glossary.md | edit only |
| 7 | where to go next | resources.md + upsell to core | edit only |

output: `content/free/lesson-01.md` through `content/free/lesson-07.md`

### core tier ($49-79): "claude code for real engineers" (60% exists)

target: working engineers who want hooks, plugins, MCP, and usage mining. this is where it gets practical.

| # | lesson | source | status |
|---|--------|--------|--------|
| 8 | hooks deep dive | hooks-guide.md | edit + restructure |
| 9 | build your first hook | hands-on: safety-guard walkthrough | NEW — use hooks/safety-guard.sh as base |
| 10 | CLI tools and headless mode | cli-tools.md | edit only |
| 11 | MCP servers | mcp-servers.md | edit only |
| 12 | multi-agent patterns | subagent-patterns.md | edit + restructure |
| 13 | /mine: mining your usage data | mine plugin overview + live demo | NEW — use plugins/mine/ as base |
| 14 | session replay and dashboards | replay-capture.sh + dashboard.py | NEW |
| 15 | slash commands that ship code | .claude/commands/ walkthrough | NEW |
| 16 | building agent prompts | .claude/agents/ walkthrough | NEW |
| 17 | workflow: bug hunt to PR | end-to-end recipe combining hooks + agents + /ship | NEW |
| 18 | workflow: codebase onboarding | explorer agent + /mine search + knowledge-builder | NEW |

output: `content/core/lesson-08.md` through `content/core/lesson-18.md`

### pro tier ($149-199): "ship with claude code" (40% exists)

target: senior engineers and leads who want autonomous workflows, custom plugins, and production patterns.

| # | lesson | source | status |
|---|--------|--------|--------|
| 19 | agent teams and worktrees | agent-teams.md | edit only |
| 20 | automation and daemons | automation.md | edit only |
| 21 | building plugins from scratch | plugin-creation.md | edit + restructure |
| 22 | the mine plugin deep dive | plugins/mine/ full architecture walkthrough | NEW |
| 23 | upstream watcher: autonomous CI | upstream-watcher-design.md | edit only |
| 24 | cost optimization strategies | advanced cost-analysis + burn hook patterns | NEW |
| 25 | production deployment patterns | CI/CD with claude code, github actions | NEW |
| 26 | building a knowledge graph | hooks/knowledge-builder/ deep dive | NEW |

output: `content/pro/lesson-19.md` through `content/pro/lesson-26.md`

### cohort ($499+, 4 weeks, limit 20): "claude code intensive"

target: teams or ambitious individuals who want hands-on guidance building real things.

| week | theme | deliverable |
|------|-------|-------------|
| 1 | setup + first automation | working hook + CLAUDE.md for their project |
| 2 | build a plugin from scratch | installable plugin with hooks + skill |
| 3 | ship a real project with CC | PR or deployed feature, end to end |
| 4 | optimize, measure, present | mine dashboard + cost report + lightning talk |

output: `content/cohort/week-01.md` through `content/cohort/week-04.md` (curriculum + exercises)

---

## content gap analysis

| tier | exists | needs writing | CC effort |
|------|--------|---------------|-----------|
| free | 95% | light editing | **`CC: 1 session`** |
| core | 60% | 7-8 new lessons | **`CC: 3-4 sessions`** |
| pro | 40% | 10-12 new lessons | **`CC: 5-7 sessions`** |
| cohort | 30% | curriculum + exercises | **`CC: 3-4 sessions`** |
| video scripts | 0% | all 30+ | **`CC: 8-10 sessions`** |
| landing page | 0% | copy + design | **`CC: 1-2 sessions`** |
| **total to launch (core + pro)** | | | **`CC: ~15 sessions`** ~~2 week sprint~~ |

---

## voice guidelines

- **course content**: casual mode. lowercase unless starting a sentence. contractions always. "bc" not "because". no fluff, no filler, no corporate voice.
- **marketing copy**: spicy mode. even more casual. short punchy sentences. make people feel like they're missing out.
- **code examples**: real, runnable, tested. never pseudo-code. always show the actual file path so people can find it in the repo.
- **NDA-safe**: teach patterns only. never mention specific client work or company-internal details.

---

## lesson format

every lesson follows this structure:

```
# lesson title

one-sentence summary of what you'll learn.

## what and why

2-3 paragraphs explaining the concept. why it matters. what problem it solves.

## how it works

technical explanation with code examples. show the actual files from the repo.
reference existing docs by path — don't duplicate content.

## try it yourself

hands-on exercise. 5-15 minutes. should produce a visible result.

## what you learned

3-5 bullet recap. link to the next lesson.
```

target length: 800-1500 words per lesson. the mine plugin is the running example throughout core and pro tiers — it touches hooks, plugins, agents, CLI tools, and dashboards, so it ties everything together naturally.

---

## build order

when you start building this course:

1. **free tier first** — it's 95% done, just needs editing and restructuring into the lesson format. quick win, builds momentum.
2. **core tier next** — the biggest gap is hands-on exercises and the 6 new lessons. the existing docs give you most of the technical content.
3. **pro tier** — more new content needed here. the mine plugin deep dive and production patterns are the hardest lessons.
4. **cohort last** — this is curriculum design, not content writing. needs the other tiers to exist first.

for each lesson:
- read the source doc(s) listed in the mapping table
- restructure into the lesson format above
- add a "try it yourself" exercise
- add cross-references to other lessons
- output to `content/{tier}/lesson-{number}.md`

---

## key files to read before writing

these are the most important files in the repo. read them to understand what you're working with:

| file | why |
|------|-----|
| `CLAUDE.md` | repo conventions, structure, voice |
| `README.md` | full inventory of everything in the repo |
| `docs/guide.md` | the existing beginner-to-advanced guide (this is your free tier backbone) |
| `docs/hooks-guide.md` | hooks reference (core tier backbone) |
| `plugins/mine/` | the flagship plugin (running example throughout the course) |
| `scripts/schema.sql` | mine database schema (referenced in mine lessons) |
| `.claude/commands/mine.md` | the /mine slash command (core tier lesson 13) |
| `.claude/agents/analyst.md` | the analyst agent (shows how agents work) |

---

## what success looks like

- a developer with zero claude code experience can go through the free tier and be productive in one sitting
- a working engineer can go through core tier in a weekend and have hooks, /mine, and multi-agent patterns running
- a senior engineer can go through pro tier and build custom plugins, autonomous CI, and production workflows
- the cohort produces real shipped projects, not toy examples
