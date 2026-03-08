<!-- tested with: claude code v1.0.34 -->

# battle-tested subagent patterns

**how to use Task, agent teams, and subagents without wasting tokens or losing your mind.**

---

## quick context

the `Task` tool spawns a subagent -- a separate Claude instance with its own context window that can read files, search code, and (optionally) make changes in an isolated worktree. subagents are powerful but expensive. this guide is about knowing when to reach for them and when to just do the work yourself.

agent teams (`TeamCreate`) are a level above -- multiple independent agents working in parallel on separate tasks with their own worktrees. they coordinate through a shared task board, not through conversation.

---

## pattern 1: parallel research

**when to use it:** you need to understand a large codebase fast. searching one area at a time is slow when the areas are independent.

**the idea:** spawn multiple explore agents simultaneously, each focused on a different part of the codebase. they read and search but do not write. you synthesize their findings.

**example Task calls:**

```json
{
  "prompt": "Find all authentication-related code in the src/auth/ and lib/auth/ directories. Map out the auth flow: how tokens are created, validated, refreshed, and revoked. List every file and its role.",
  "description": "map auth subsystem"
}
```

```json
{
  "prompt": "Find all database access patterns in src/db/ and lib/models/. List every query, which tables they touch, and whether they use transactions. Note any raw SQL vs ORM usage.",
  "description": "map database layer"
}
```

```json
{
  "prompt": "Find all API route definitions across the codebase. For each route, note the HTTP method, path, handler function, and which middleware it uses. Focus on src/routes/ and api/.",
  "description": "map API routes"
}
```

**spawn all three at once.** they have no dependencies on each other. when they return, you have a complete picture of auth, database, and API layers without having done any of the searching yourself.

**pitfalls:**
- do not spawn 10 agents. 2-4 is the sweet spot. each one costs tokens and takes time to spin up.
- do not use this for small codebases where a few Grep calls would answer your question in seconds.
- the agents return text summaries, not structured data. be specific in your prompts about what format you want back.

**real-world scenario:** you are onboarding onto a monorepo with 200+ files. instead of reading files one by one, spawn three explore agents to map the three main subsystems. you get a complete architecture overview in the time it would take to manually read 20 files.

---

## pattern 2: specialist delegation

**when to use it:** you have a well-defined subtask that benefits from focused attention and a clean context window.

**the idea:** instead of doing everything in one context (where your auth refactor instructions compete with your test-writing instructions for attention), delegate specific work to typed agents that have a single job.

**example -- test writer:**

```json
{
  "prompt": "Write comprehensive unit tests for src/auth/token-service.ts. The file exports createToken(), validateToken(), refreshToken(), and revokeToken(). Use vitest. Cover happy paths, edge cases (expired tokens, malformed input, missing fields), and error handling. Put tests in src/auth/__tests__/token-service.test.ts.",
  "description": "write token service tests"
}
```

**example -- code reviewer:**

```json
{
  "prompt": "Review the changes in src/auth/ for security issues. Check for: SQL injection, missing input validation, token leakage in logs, insecure defaults, missing rate limiting. Read every modified file and provide a structured review with severity levels.",
  "description": "security review auth changes"
}
```

**example -- migration writer:**

```json
{
  "prompt": "Create a database migration to add a 'revoked_at' column to the tokens table. Use the same migration framework as existing migrations in db/migrations/. Include both up and down migrations. Check existing migrations for naming conventions and patterns.",
  "description": "create token revocation migration"
}
```

**pitfalls:**
- do not delegate tasks that require understanding of what you just discussed in the main conversation. the subagent has no context from your conversation -- only what you put in the prompt.
- be extremely specific. the agent cannot ask you clarifying questions. front-load all the context it needs.
- for file writes, specify exact paths. "put the tests somewhere reasonable" is a recipe for weird placements.

**real-world scenario:** you are refactoring the auth system. you write the new token service yourself (bc it requires design decisions), then delegate test-writing and migration-writing to specialist agents. they work while you move on to the next component.

---

## pattern 3: background workers

**when to use it:** you have a long-running task that does not block your current work. tests, builds, linting, documentation generation.

**the idea:** use `run_in_background` in Bash to kick off a long process, keep working, check on it later. this is not a subagent pattern per se -- its a Bash pattern -- but it pairs well with subagents.

**example -- run tests in background while continuing work:**

```json
{
  "command": "npm test -- --reporter=json > /tmp/test-results.json 2>&1",
  "description": "run full test suite",
  "run_in_background": true
}
```

then later:

```json
{
  "command": "cat /tmp/test-results.json | jq '.numFailedTests'",
  "description": "check test results"
}
```

**pairing with subagents:** spawn a Task agent to do complex work, and meanwhile use the main context to keep making changes. when the agent returns, you get its findings and can act on them.

**pitfalls:**
- background Bash processes do not give you structured feedback. you need to check output files manually.
- do not background tasks that the next step depends on. if you need test results to decide what to fix, wait for them.
- long-running subagents tie up resources. use the `timeout` field if you want to cap how long they run.

**real-world scenario:** you are making changes across 5 files. kick off the test suite in the background after each change. by the time you finish the fifth file, the first test run is done and you can check for regressions without having waited at all.

---

## pattern 4: worktree isolation

**when to use it:** you want an agent to make changes that you review before they touch your working tree. code generation, refactors, experimental approaches.

**the idea:** `isolation: "worktree"` creates a git worktree for the subagent. it makes all its changes there. you review the diff, cherry-pick what you want, discard the rest.

**example:**

```json
{
  "prompt": "Refactor src/api/routes.ts to use the new router pattern from lib/router.ts. Update all 12 route handlers to use the new middleware chain. Make sure imports are correct and TypeScript compiles.",
  "description": "refactor routes to new pattern",
  "isolation": "worktree"
}
```

the agent works in a clean worktree. when it finishes, you see the diff against your current branch. you can:

```bash
# review changes
git diff main..worktree-branch -- src/api/

# cherry-pick specific files
git checkout worktree-branch -- src/api/routes.ts

# or merge the whole thing
git merge worktree-branch
```

**pitfalls:**
- worktrees add overhead. do not use them for read-only research tasks.
- the agent works on a snapshot of your code at worktree creation time. if you make changes in the main tree while the agent is working, there may be merge conflicts.
- worktrees require git. if your project is not a git repo, this will not work. (you can override with the `WorktreeCreate` hook for other VCS -- see the [hooks guide](./hooks-guide.md).)

**real-world scenario:** you want to try two different approaches to a refactor. spawn two worktree-isolated agents, each with a different strategy. compare the diffs, pick the better one.

---

## pattern 5: agent teams

**when to use it:** you have 2-5 truly independent tasks that do not need to coordinate mid-flight. each task is substantial enough to justify its own agent and context window.

**the idea:** `TeamCreate` spins up a team of agents, each with their own worktree and task list. they work in parallel without talking to each other. when they are all done, you review and merge.

this is different from sequential subagents. teams work simultaneously. subagents work one at a time.

**when teams beat subagents:**

| Scenario | Use teams | Use subagents |
|---|---|---|
| 3 independent feature branches | yes | no |
| Research that informs implementation | no | yes (sequential) |
| Tests + docs + migration for the same feature | yes | depends |
| Quick lookup then complex work | no | yes (scout pattern) |

**agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`** in your settings or environment.

**how to think about it:** if you could give the tasks to three different developers who do not need to talk to each other, use a team. if developer B needs developer A's output, use sequential subagents.

**pitfalls:**
- teams are expensive. each agent is a full Claude instance with its own context window.
- merging can get messy if agents touch overlapping files. define clear boundaries.
- teams cannot coordinate mid-flight. if agent A discovers something agent B needs to know, there is no way to communicate that until both finish.
- do not create a team for one task. thats just a subagent with extra overhead.

**real-world scenario:** you need to add a new feature that touches the API, the database, and the frontend. create a team: one agent handles the API routes and controllers, one handles the migration and model changes, one handles the frontend components. clear boundaries, parallel execution, merge when done.

---

## pattern 6: the scout pattern

**when to use it:** you are not sure what you are dealing with and do not want to burn expensive model time on exploration.

**the idea:** send a fast, cheap agent (haiku) to explore first. it reads files, searches code, maps the territory. based on its findings, you send a more capable agent (sonnet or opus) to do the real work with full context.

**step 1 -- scout with haiku:**

```json
{
  "prompt": "Find all files related to user authentication in this codebase. For each file, note: the file path, what it exports, and what it depends on. Do NOT make any changes. Just report back a structured map.",
  "description": "scout auth codebase",
  "model": "claude-haiku-4-5"
}
```

**step 2 -- act on findings:**

now you know exactly which files matter. you (or a sonnet agent) can make targeted changes without wasting tokens reading irrelevant files.

```json
{
  "prompt": "Refactor the following files to use the new auth middleware pattern:\n- src/auth/middleware.ts (main middleware, exports authMiddleware)\n- src/auth/token.ts (token validation, exports validateToken)\n- src/routes/protected.ts (uses old auth pattern)\n\nThe new pattern is defined in lib/auth/v2-middleware.ts. Read that file first to understand the target pattern, then update the three files above.",
  "description": "refactor auth to v2 middleware"
}
```

**why this saves tokens:** haiku is ~60x cheaper than opus. a 5-minute haiku exploration that reads 30 files costs almost nothing. a sonnet agent that reads the same 30 files costs meaningful tokens. scout with haiku, strike with sonnet.

**pitfalls:**
- the scout's findings are only as good as your prompt. "look at the auth code" is vague. "find all files in src/auth/, list exports and dependencies" is actionable.
- do not use haiku for complex reasoning or code generation. its a mapper, not a maker.
- the scout's output becomes part of your context. if it writes a novel, you are paying for those input tokens on the next call.

**real-world scenario:** you are fixing a bug in a codebase you have never seen. send haiku to find all files related to the error message. it comes back with 4 files and their relationships. now you can fix the bug in one targeted pass instead of hunting through the codebase.

---

## anti-patterns

### spawning agents for simple grep/glob

**the crime:**

```json
{
  "prompt": "Search for all files that import from 'lodash'",
  "description": "find lodash usage"
}
```

**why its wrong:** this is a Grep call. literally one tool call. spawning a subagent for this is like hiring a contractor to flip a light switch.

**just do this:**

```
Grep pattern: "from 'lodash'" or "require.*lodash"
```

done. 0.1 seconds. no subagent overhead.

**rule of thumb:** if the task can be done with 1-3 tool calls (Grep, Glob, Read), do it directly. subagents are for tasks that require judgment, multiple steps, or file modifications.

---

### chaining agents that depend on each other

**the crime:** spawning agent A to gather info, then immediately spawning agent B that needs agent A's output -- but running them in parallel.

the subagent cannot see the other subagent's results. you end up with agent B guessing or failing.

**fix:** run them sequentially. wait for agent A to return, then use its findings to prompt agent B.

```
1. spawn agent A (research) -> wait for results
2. use agent A's findings in agent B's prompt (implementation)
```

or better yet, if the dependency is tight, just do both tasks in the main context. subagents are for independent work.

---

### using opus for quick lookups

**the crime:**

```json
{
  "prompt": "What testing framework does this project use?",
  "description": "check test framework"
}
```

this spins up the most expensive model to read a `package.json`. haiku can do this for 60x less.

**fix:** either just Read the file yourself, or if you must use a subagent, specify haiku:

```json
{
  "prompt": "Read package.json and tell me what testing framework is configured.",
  "description": "check test framework",
  "model": "claude-haiku-4-5"
}
```

but honestly just `Read package.json`. the answer is right there.

---

### over-delegating

**the crime:** spawning a subagent for every subtask, even simple ones.

```
"create a variable name" -> subagent
"add an import statement" -> subagent
"write a one-line comment" -> subagent
```

each subagent has startup cost, context loading, and token overhead. if a task takes you 30 seconds and one tool call, do it yourself.

**rule of thumb:** delegate tasks that are:
- independent (do not need your current context)
- substantial (10+ tool calls or complex reasoning)
- parallelizable (can run while you do other work)
- isolatable (clear inputs, clear outputs)

if a task does not meet at least two of these criteria, just do it inline.

---

## decision flowchart

when you are wondering "should i use a subagent here?" run through this:

```
1. can i do this with 1-3 tool calls?
   yes -> do it yourself. no subagent.

2. does this task need context from my current conversation?
   yes -> do it yourself (subagent has no conversation context).

3. is this task independent from what i am currently doing?
   no -> do it yourself or wait and do it sequentially.
   yes -> continue.

4. is this task substantial (10+ steps, complex reasoning)?
   no -> probably do it yourself.
   yes -> use a subagent.

5. do i need to review changes before they hit my working tree?
   yes -> use isolation: "worktree".

6. are there multiple independent substantial tasks?
   yes -> consider agent teams (if 2-5 tasks).
   no -> use a single subagent.

7. am i not sure what i am dealing with?
   yes -> scout with haiku first, then act.
```

---

## subagent prompting tips

bc the prompt is everything when the agent cannot ask follow-up questions:

1. **front-load context.** the agent starts with zero knowledge. tell it the project structure, the relevant files, the conventions.

2. **be specific about output.** "refactor the auth module" is vague. "update src/auth/middleware.ts to export a function called `createAuthMiddleware` that takes a `config: AuthConfig` parameter" is actionable.

3. **specify file paths.** do not make the agent guess where files should go. "write tests in `src/auth/__tests__/middleware.test.ts`" is explicit.

4. **set boundaries.** "only modify files in src/auth/. do not touch src/routes/ or any test files." prevents scope creep.

5. **describe the end state.** "when you are done, all TypeScript files in src/auth/ should compile without errors and use the v2 middleware pattern from lib/auth/v2.ts."

---

*For hook events that fire during subagent lifecycle (SubagentStart, SubagentStop, TeammateIdle), see the [hooks guide](./hooks-guide.md).*
