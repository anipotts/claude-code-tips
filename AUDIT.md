# repo audit and reorganization proposal

**date:** march 8, 2026
**scope:** gap analysis vs recent claude code features, competitive analysis vs shanraisshan/claude-code-best-practice (12.3k stars), long-term vision for becoming _the_ claude code resource

---

## part 1: what you're missing from recent claude code updates

### features you have zero coverage of

1. **agent teams** -- multiple parallel agents working on the same codebase via tmux + git worktrees. this is the hottest workflow pattern right now and you don't mention it anywhere. your `explorer` agent touches worktrees but you have no guide on orchestrating multi-agent teams, no tmux setup, no patterns for splitting work across agents

2. **voice mode** -- speech-to-prompt is shipping and replacing third-party tools like wispr flow. you mention wispr in your notify hook but have no docs on native voice mode setup, workflows, or tips

3. **scheduled tasks / `/loop`** -- recurring prompts that run up to 3 days unattended. monitoring, health checks, continuous testing. your `guardian` agent is a poor man's version of this -- you should document the native feature and show how guardian complements it

4. **remote control** -- continuing sessions across devices. your `handoff` plugin solves a related problem (context preservation before compaction) but remote control is a different beast and you don't mention it

5. **git worktrees as a first-class feature** -- claude code now uses worktrees for agent isolation natively. your explorer agent uses them but you have no standalone guide on the worktree workflow

6. **`/sandbox` mode** -- isolated execution environment. not documented anywhere in your repo

7. **`/doctor` command** -- diagnostics for troubleshooting claude code itself. not documented

8. **`/rewind` / `Esc Esc`** -- undo/rollback within a session. not documented

9. **`/context` command** -- context window management. not documented

10. **checkpointing** -- git-based file edit tracking with rewind capability. not documented as a concept

11. **status line customization** -- your miner plugin uses gauge for status but you have no guide on the status line system itself (context usage, cost metrics, custom providers)

12. **settings.json deep dive** -- you cover config locations but don't have a dedicated guide on the full settings schema, permission modes, wildcard permissions syntax, model configuration, managed policies

13. **cross-model workflows** -- using claude code + codex or other models together. the RPI (research-plan-implement) methodology. not documented

14. **thinking mode / ultrathink** -- reasoning effort control. you don't document how to use thinking modes effectively or the ultrathink keyword

15. **session management** -- renaming sessions, resuming with `--continue`, session lifecycle. scattered mentions but no dedicated coverage

### features you cover but could go deeper

1. **CLAUDE.md** -- you explain it well in the guide but shanraisshan's repo points out keeping it under 200 lines, using multiple CLAUDE.md files for monorepos, and using `.claude/rules/` for overflow. your guide doesn't cover any of this

2. **MCP servers** -- you cover playwright and context7 but miss Chrome DevTools MCP, the comparison between browser automation MCPs, and patterns for building production MCP servers

3. **commands vs skills vs agents** -- you have all three categories but no doc explaining when to use which, the orchestration pattern (command -> agent -> skill), or the progressive disclosure pattern

4. **permissions** -- you mention them but don't document wildcard permission syntax (`"Bash(npm test:*)"`) as a safer alternative to `--dangerously-skip-permissions`

5. **cost optimization** -- your miner tracks costs but you have no guide on managing costs, understanding cache efficiency, or strategies for reducing token usage

---

## part 2: competitive analysis vs shanraisshan/claude-code-best-practice

### what they have that you don't

| their feature | your equivalent | gap |
|---|---|---|
| 12 core concepts taxonomy | scattered docs | no unified conceptual framework |
| orchestration workflow (command->agent->skill) with GIF + SVG | separate docs for each | no orchestration guide |
| implementation guides (copy-paste ready) | agent/skill configs | close, but theirs are more tutorial-style |
| 27 curated tips with categories | guide.md | your guide is deeper but tips format is more scannable |
| 8 deep-dive reports (SDK vs CLI, Chrome vs DevTools, settings scope, monorepo skills, agent memory, advanced tool use, rate limits, LLM degradation) | nothing equivalent | major gap -- you have no analytical content |
| RPI methodology (research-plan-implement) | nothing equivalent | workflow methodology gap |
| cross-model workflow (claude + codex) | nothing equivalent | multi-model gap |
| "billion-dollar questions" / open questions | nothing equivalent | community engagement gap |
| boris cherny tips aggregation | nothing equivalent | you don't curate anthropic staff insights |
| visual diagrams (SVG, GIF for orchestration) | GIFs for your tools | no architecture/concept diagrams |
| feature displacement tracking (what replaces what) | nothing equivalent | product evolution tracking gap |

### what you have that they don't

| your feature | their equivalent |
|---|---|
| working plugins (miner, handoff, broadcast) | documentation only, no working code |
| real hooks with real scripts | examples only |
| session mining to sqlite with FTS5 | nothing |
| 8 ready-to-use agents | documentation of agent concept only |
| 5 functional skills | documentation of skill concept only |
| 3 functional commands | documentation of command concept only |
| plugin creation guide + marketplace publishing | nothing |
| automation guide (daemons, cron, watchers) | nothing |
| CLI tools guide (headless `claude -p`) | nothing |
| VHS tape files for reproducible GIFs | static GIFs only |

### the key insight

**they document. you build.** but documentation is what gets stars. their repo is a reference guide that 12.3k people bookmark. yours is a toolbox that fewer people discover bc the toolbox needs the reference guide wrapped around it.

**the winning move: be both.**

---

## part 3: proposed reorganization

### current structure (flat, builder-focused)

```
agents/
commands/
docs/
gifs/
hooks/
plugins/
scripts/
skills/
```

### proposed structure (layered, audience-aware)

```
claude-code-tips/
├── README.md                          # hero page -- what this is, quick install, visual showcase
├── CLAUDE.md                          # project instructions (keep as-is)
├── LICENSE
│
├── guide/                             # THE GUIDE (replaces docs/guide.md, becomes multi-file)
│   ├── README.md                      # table of contents
│   ├── 01-getting-started.md          # install, first session, mental model
│   ├── 02-claude-md.md                # CLAUDE.md mastery (monorepos, rules/, 200-line rule)
│   ├── 03-settings.md                 # NEW: full settings deep dive
│   ├── 04-permissions.md              # NEW: permission modes, wildcards, security
│   ├── 05-hooks.md                    # consolidated from docs/hooks-guide.md
│   ├── 06-commands-skills-agents.md   # NEW: the extensibility stack explained
│   ├── 07-plugins.md                  # consolidated from docs/plugin-creation.md
│   ├── 08-mcp-servers.md              # consolidated from docs/mcp-servers.md
│   ├── 09-subagents.md                # consolidated from docs/subagent-patterns.md
│   ├── 10-agent-teams.md              # NEW: multi-agent orchestration, tmux, worktrees
│   ├── 11-cli-and-automation.md       # consolidated cli-tools + automation
│   ├── 12-cost-optimization.md        # NEW: tokens, caching, cost strategies
│   ├── 13-voice-and-remote.md         # NEW: voice mode, remote control, scheduled tasks
│   ├── 14-session-management.md       # NEW: sessions, checkpointing, /rewind, /doctor
│   ├── 15-cross-model-workflows.md    # NEW: RPI, claude + codex, multi-model patterns
│   └── 16-going-crazy.md             # miner, self-improvement loops, daemons, advanced
│
├── tips/                              # NEW SECTION: scannable tips (compete with shanraisshan)
│   ├── README.md                      # all tips index
│   ├── planning.md                    # plan mode, user interviews, phased plans
│   ├── workflows.md                   # daily workflow tips, context management
│   ├── advanced.md                    # agent teams, ultrathink, ascii diagrams
│   ├── debugging.md                   # screenshots, MCP debugging, /doctor
│   └── productivity.md               # terminal setup, voice, status line, shortcuts
│
├── reports/                           # NEW SECTION: deep-dive analysis (compete with shanraisshan)
│   ├── README.md
│   ├── sdk-vs-cli-prompts.md          # system prompt differences
│   ├── browser-mcp-comparison.md      # chrome vs devtools vs playwright
│   ├── settings-scope.md             # global vs project vs managed
│   ├── monorepo-patterns.md          # skills, CLAUDE.md, rules for monorepos
│   ├── agent-memory.md               # frontmatter, persistence, context lifecycle
│   ├── cost-analysis.md              # real data from miner on cost patterns
│   └── model-selection.md            # when to use opus vs sonnet vs haiku
│
├── recipes/                           # NEW SECTION: copy-paste workflows
│   ├── README.md
│   ├── orchestration-workflow.md      # command -> agent -> skill pattern
│   ├── rpi-methodology.md            # research-plan-implement
│   ├── code-review-pipeline.md       # vibe-check -> test-writer -> ship
│   ├── monitoring-loop.md            # guardian + /loop + scheduled tasks
│   ├── parallel-exploration.md       # agent teams + worktrees
│   └── self-improving-claude-md.md   # /improve loop with git history
│
├── plugins/                           # (keep as-is, working code)
│   ├── miner/
│   ├── handoff/
│   └── broadcast/
│
├── hooks/                             # (keep as-is, working code)
│   ├── safety-guard.sh
│   ├── panopticon.sh
│   ├── context-save.sh
│   ├── knowledge-builder/
│   └── notify.sh
│
├── agents/                            # (keep as-is, working code)
│   ├── analyst.md
│   ├── explorer.md
│   ├── guardian.md
│   ├── code-sweeper.md
│   ├── pr-narrator.md
│   ├── dep-checker.md
│   ├── test-writer.md
│   └── vibe-check.md
│
├── skills/                            # (keep as-is, working code)
│   ├── sift.md
│   ├── improve.md
│   ├── ship.md
│   ├── sweep.md
│   └── quicktest.md
│
├── commands/                          # (keep as-is, working code)
│   ├── ledger.md
│   ├── stats.md
│   └── deps.md
│
├── scripts/                           # (keep as-is)
│   ├── mine.py
│   └── schema.sql
│
├── gifs/                              # (keep as-is)
│
├── examples/                          # NEW SECTION: real-world example configs
│   ├── claude-md/                     # example CLAUDE.md files for different project types
│   │   ├── typescript-monorepo.md
│   │   ├── python-ml.md
│   │   ├── rust-cli.md
│   │   └── fullstack-nextjs.md
│   ├── settings/                      # example settings.json configs
│   │   ├── solo-developer.json
│   │   ├── team-project.json
│   │   └── enterprise.json
│   └── rules/                         # example .claude/rules/ files
│       ├── testing-rules.md
│       ├── security-rules.md
│       └── style-rules.md
│
└── reference/                         # NEW SECTION: quick-reference cards
    ├── keyboard-shortcuts.md
    ├── cli-flags.md
    ├── hook-events.md
    ├── settings-schema.md
    └── slash-commands.md
```

### why this structure wins long-term

1. **guide/** -- progressive, chapter-based learning. a beginner can read 01-03 and be productive. an advanced user reads 10-16. this is what makes people bookmark your repo

2. **tips/** -- scannable, tweetable, linkable. this is how shanraisshan got 12.3k stars. short actionable items people can share on reddit and twitter

3. **reports/** -- deep analytical content that establishes authority. nobody else is publishing real data-backed analysis of claude code patterns. your miner gives you a unique advantage here -- you can back claims with actual session data

4. **recipes/** -- end-to-end workflows people can copy. not "here's a hook" but "here's how to set up a complete code review pipeline using three of my tools together"

5. **examples/** -- the most requested thing in any dev tool repo. real configs for real project types. people google "CLAUDE.md example typescript" and land on your repo

6. **reference/** -- quick-lookup cards. when someone needs the keyboard shortcut or the CLI flag, they come here. high SEO value, low maintenance

7. **plugins/hooks/agents/skills/commands** -- unchanged. the working code stays exactly where it is. you just wrapped a knowledge layer around it

---

## part 4: content you should write (priority order)

### tier 1 -- write these first (highest impact, biggest gaps)

1. **agent teams guide** (`guide/10-agent-teams.md`) -- tmux setup, worktree isolation, task splitting patterns, coordination strategies. this is the hottest topic in claude code right now

2. **the extensibility stack** (`guide/06-commands-skills-agents.md`) -- when to use each, the orchestration pattern, progressive disclosure. this is the single biggest conceptual gap

3. **settings deep dive** (`guide/03-settings.md`) -- full schema, permission modes, wildcard syntax, managed policies, model config. every user needs this

4. **tips section** (`tips/`) -- port the 27-tip format from shanraisshan but make them yours. opinionated, tested, with links to your tools

5. **example CLAUDE.md files** (`examples/claude-md/`) -- 4-5 real configs for common project types. this will be your highest-traffic content

### tier 2 -- write these next (differentiation)

6. **cost analysis report** (`reports/cost-analysis.md`) -- use your miner data. nobody else has this. show real token usage patterns, cache hit rates, cost per task type. this is your unique moat

7. **orchestration recipe** (`recipes/orchestration-workflow.md`) -- the command->agent->skill pattern with your actual tools as the example

8. **session management guide** (`guide/14-session-management.md`) -- checkpointing, /rewind, /doctor, session lifecycle, --continue

9. **voice and remote guide** (`guide/13-voice-and-remote.md`) -- voice mode, remote control, /loop, scheduled tasks

10. **reference cards** (`reference/`) -- keyboard shortcuts, CLI flags, hook events, slash commands. high SEO value

### tier 3 -- write these for completeness

11. **cross-model workflows** (`guide/15-cross-model-workflows.md`)
12. **monorepo patterns report** (`reports/monorepo-patterns.md`)
13. **browser MCP comparison** (`reports/browser-mcp-comparison.md`)
14. **model selection report** (`reports/model-selection.md`)
15. **permissions guide** (`guide/04-permissions.md`)

---

## part 5: the long game -- becoming "the claude code guy"

### what shanraisshan is doing right

- single comprehensive reference that consolidates scattered knowledge
- visual (GIFs, SVGs, diagrams)
- tracks feature velocity -- documents new features as they ship
- curates anthropic staff insights
- poses open questions (community engagement)

### what you should do differently

1. **be the builder, not just the documenter.** shanraisshan documents features. you build tools on top of them. miner is a genuine product. handoff solves a real problem. lean into this -- you're not competing on documentation alone, you're competing on *utility*

2. **publish your miner data.** you have 4,000+ sessions of real usage data. write reports with actual numbers. "across 4,000 sessions, the average cost per task is X, cache hit rates average Y%, and opus is Z% more expensive than sonnet for equivalent tasks." nobody else can do this. this is your moat

3. **create a "changelog" section.** every time claude code ships something new, write a quick take on what it means and how your tools relate to it. this makes your repo a living resource that people check regularly, not a one-time bookmark

4. **build a community layer.** add a discussions tab on github. pose your own "billion-dollar questions." respond to issues. the repos that become canonical resources are the ones with active maintainers

5. **video content.** your VHS tapes are good but consider screen recordings with narration. a 5-minute video walkthrough of miner or a hook setup will get shared more than any markdown file

6. **the "learning path."** explicitly label content by skill level and create recommended reading orders. "if you're new, start here. if you're intermediate, jump to here. if you're already dangerous, go straight to the miner guide"

7. **plugin marketplace presence.** you already have plugin.json and marketplace.json. push miner and your other plugins into the marketplace. every install is a funnel back to your repo

8. **track what replaces what.** when claude code ships a native feature that replaces a third-party tool (voice mode replacing wispr, remote control replacing openclaw), document the transition. this positions you as the person who understands the ecosystem

9. **seasonal/annual reviews.** write "state of claude code" posts. what shipped this quarter, what's coming, what patterns are emerging. this is how you become the authority

10. **contributions guide.** make it easy for others to contribute tips, recipes, agents, hooks. the more contributors, the more the repo grows, the more it becomes the canonical resource

### the 10-year play

year 1-2 (2026-2027): become the most comprehensive claude code resource. beat shanraisshan on depth (you already win on tooling). combine documentation + working tools + data-backed analysis

year 3-5 (2028-2030): as agentic programming matures, your patterns become the reference implementation. the "claude code tips" brand expands to cover the broader agentic coding ecosystem

year 5-10 (2030-2036): the patterns you document today become the foundation of how people think about AI-assisted development. the early, thorough, opinionated documentation wins. you're not just "the claude code guy" -- you're the person who wrote the playbook for human-AI collaborative development

---

## part 6: immediate action items

1. [ ] create `guide/` directory and split `docs/guide.md` into chapters
2. [ ] write `guide/06-commands-skills-agents.md` (extensibility stack)
3. [ ] write `guide/10-agent-teams.md` (multi-agent orchestration)
4. [ ] write `guide/03-settings.md` (settings deep dive)
5. [ ] create `tips/` with 5 tip files covering major categories
6. [ ] create `examples/claude-md/` with 4 example configs
7. [ ] create `reference/` with quick-lookup cards
8. [ ] create `recipes/` with 3 end-to-end workflow guides
9. [ ] create `reports/` with cost analysis from miner data
10. [ ] update README.md to reflect new structure and vision
11. [ ] add a CONTRIBUTING.md
12. [ ] enable github discussions

---

*this audit was generated from analysis of the current repo state, the shanraisshan/claude-code-best-practice repo (12.3k stars), and recent claude code feature releases through march 7, 2026.*
