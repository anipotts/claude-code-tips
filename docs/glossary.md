# glossary

terms used across this repo and claude code docs.

<!-- tested with: claude code v1.0.34 -->

---

**agent** -- an autonomous prompt template that claude code runs as a subagent. agents can use tools, create files, and make decisions independently. defined in `.claude/agents/` as markdown files. see [subagent patterns](./subagent-patterns.md).

**agent team** -- multiple agents working together on a task. claude code manages coordination, passing context between agents. useful for parallel work like code review + testing + documentation in one go.

**broadcast** -- plugin in this repo. sends async notifications (system alerts, slack, etc.) when claude code events fire. useful for long-running headless sessions.

**CLAUDE.md** -- the project instruction file claude code reads at session start. lives at project root, `.claude/CLAUDE.md`, or `~/.claude/CLAUDE.md` (global). the single most important file for shaping behavior. see [guide](./guide.md#3-claudemd----your-projects-brain).

**command** -- a user-defined slash command. defined as markdown files in `.claude/commands/`. invoked with `/commandname` in-session. simpler than skills -- just a prompt template.

**compaction** -- claude code's automatic context compression when the conversation approaches token limits. the system summarizes earlier messages to free space. the PreCompact hook fires before this happens.

**context-save** -- hook in this repo. automatically preserves important context before compaction so you don't lose key decisions or findings.

**echo** -- miner plugin feature. recalls past solutions to similar problems by searching session history via FTS5. fires on SessionStart.

**FTS5** -- sqlite full-text search extension. used by the miner plugin for fast searching across session transcripts and tool logs.

**gauge** -- miner plugin feature. analyzes your prompt complexity and current model, then suggests whether you're overpaying or underpowered. fires on UserPromptSubmit.

**handoff** -- plugin in this repo. preserves conversation context before compaction or between sessions. writes structured summaries so the next session picks up where you left off.

**hook** -- a script that runs in response to claude code events. hooks can observe (PostToolUse), modify (PreToolUse), or block (exit code 2) tool actions. configured in `settings.json`. see [hooks guide](./hooks-guide.md).

**hook event** -- the trigger point for a hook. current events: PreToolUse, PostToolUse, PreCompact, Notification, Stop, SubagentStop, SessionStart, SessionEnd, UserPromptSubmit.

**imprint** -- miner plugin feature. detects your project's tech stack from manifest files and connects it to patterns from your other projects. fires on SessionStart.

**MCP (model context protocol)** -- a standard for connecting AI models to external tools and data sources. MCP servers expose tools that claude code discovers at session start and calls like built-in tools. see [MCP servers](./mcp-servers.md).

**miner** -- the flagship plugin in this repo. mines every claude code session into a local sqlite database, enabling cost tracking, solution recall, mistake memory, and model recommendations. see [miner README](../plugins/miner/README.md).

**panopticon** -- hook in this repo. logs all tool calls for audit and analysis. fires on PostToolUse.

**plugin** -- a packaged collection of hooks, agents, skills, and commands distributed as a unit. installed via `claude plugin add`. defined by a `plugin.json` manifest. see [plugin creation](./plugin-creation.md).

**plugin.json** -- the manifest file for a plugin. defines metadata, hooks, agents, skills, and commands. must be valid JSON (no trailing commas).

**PostToolUse** -- hook event that fires after a tool completes. useful for logging, analysis, or triggering follow-up actions. receives tool name, input, and output.

**PreCompact** -- hook event that fires before context compaction. useful for saving important context that would otherwise be summarized away.

**PreToolUse** -- hook event that fires before a tool is used. can block the action (exit 2) or let it proceed (exit 0). receives tool name and input.

**safety-guard** -- hook in this repo. blocks dangerous Bash commands (rm -rf, sudo, etc.) before execution via PreToolUse.

**scar** -- miner plugin feature. remembers past tool failures and their fixes. when the same failure pattern appears, it warns claude before it repeats the mistake. fires on PostToolUseFailure.

**SessionEnd** -- hook event that fires when a session ends. miner uses this for ingesting the full session transcript.

**SessionStart** -- hook event that fires when a new session begins. useful for loading context, checking environment, or surfacing past work.

**skill** -- a markdown template that defines a reusable prompt pattern. richer than commands -- skills can include frontmatter config, multi-step instructions, and conditional logic. defined in `.claude/skills/` as markdown files.

**subagent** -- a claude code session spawned within another session to handle a subtask. subagents can run in parallel and use worktrees for code isolation. see [subagent patterns](./subagent-patterns.md).

**upstream watcher** -- this repo's github actions pipeline that monitors claude code releases, competitor changes, and community content, then auto-updates the docs and comparisons.

**UserPromptSubmit** -- hook event that fires when the user submits a prompt. useful for prompt classification, routing, or pre-processing.

**worktree** -- a git feature that creates a separate working directory sharing the same repo history. claude code uses worktrees to let subagents work on code without conflicting with the main session's working directory.
