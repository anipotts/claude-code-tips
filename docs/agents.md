<!-- tested with: claude code v2.1.77 -->

# agents

how i use subagents and agent teams -- the patterns that work, the anti-patterns that waste money.

---

## the mental model

a subagent is a separate claude instance with its own context window. it can read files, search code, and optionally make changes in an isolated worktree. subagents are powerful but expensive -- each one is a full billing stream.

agent teams are a level above -- multiple independent agents working in parallel on separate tasks with their own worktrees. they coordinate through a shared task board, not conversation.

the theme: **delegate substantial, independent work. do small stuff yourself.**

---

## when to use subagents vs doing it yourself

```
1. can i do this with 1-3 tool calls?
   yes -> do it yourself.

2. does this task need context from my current conversation?
   yes -> do it yourself (subagent has no conversation context).

3. is this task independent from what i'm currently doing?
   no -> do it yourself or run sequentially.

4. is this task substantial (10+ steps, complex reasoning)?
   no -> probably do it yourself.
   yes -> use a subagent.

5. do i need to review changes before they hit my working tree?
   yes -> use isolation: "worktree".

6. are there multiple independent substantial tasks?
   yes -> consider agent teams (2-5 tasks).
```

---

## pattern 1: parallel research

spawn multiple explore agents simultaneously, each focused on a different part of the codebase. they read and search but don't write. you synthesize their findings.

```json
{"prompt": "Map all auth-related code in src/auth/ and lib/auth/. List every file and its role.", "description": "map auth subsystem"}
{"prompt": "Find all database access patterns in src/db/. Note raw SQL vs ORM usage.", "description": "map database layer"}
{"prompt": "Find all API route definitions. Note HTTP method, path, handler, middleware.", "description": "map API routes"}
```

spawn all three at once. when they return, you have the full picture without having done any searching yourself. 2-4 agents is the sweet spot -- don't spawn 10.

---

## pattern 2: specialist delegation

instead of doing everything in one context window, delegate specific work to agents with a single job.

**test writer:**
```json
{
  "prompt": "Write unit tests for src/auth/token-service.ts. Use vitest. Cover happy paths, edge cases, error handling. Put tests in src/auth/__tests__/token-service.test.ts.",
  "description": "write token service tests"
}
```

**security reviewer:**
```json
{
  "prompt": "Review changes in src/auth/ for SQL injection, missing validation, token leakage, insecure defaults. Provide structured review with severity levels.",
  "description": "security review auth changes"
}
```

key: be extremely specific. the agent can't ask clarifying questions. front-load all context it needs. specify exact file paths.

---

## pattern 3: the scout pattern

send a fast cheap agent (haiku) to explore first, then a capable agent (sonnet) to act on the findings.

**step 1 -- scout with haiku:**
```json
{
  "prompt": "Find all files related to user authentication. Note file path, exports, dependencies. DO NOT make changes.",
  "description": "scout auth codebase",
  "model": "claude-haiku-4-5"
}
```

**step 2 -- act on findings:**
use the scout's findings to write a targeted prompt for sonnet. haiku is ~60x cheaper than opus -- a 5-minute haiku exploration that reads 30 files costs almost nothing.

---

## pattern 4: worktree isolation

`isolation: "worktree"` creates a git worktree for the agent. it makes all changes there. you review the diff, cherry-pick what you want, discard the rest.

```json
{
  "prompt": "Refactor src/api/routes.ts to use the new router pattern. Update all 12 route handlers.",
  "description": "refactor routes",
  "isolation": "worktree"
}
```

great for: experimental approaches, risky refactors, anything you want to review before it touches your working tree. don't use for read-only research (worktrees add overhead).

---

## agent teams

2-5 claude instances working simultaneously on the same project. each gets its own worktree -- a full, isolated copy of the repo.

### when to use teams

| scenario | team? | why |
|---|---|---|
| refactor 3 independent modules | yes | no shared state |
| add API endpoint + write tests for it | no | tests depend on endpoint code |
| research 3 competing approaches | yes | each is self-contained |
| fix a bug then update docs about the fix | no | docs depend on knowing the fix |

**rule of thumb:** if you could assign the tasks to 3 developers who never talk to each other, use a team. if developer B needs to slack developer A a question, use sequential subagents.

### how they work

1. coordinator spawns teammates via the `Task` tool with `isolation: "worktree"`
2. each teammate gets its own worktree
3. teammates can't see each other -- no shared memory, no message passing
4. coordinator collects results when they finish
5. you review and merge the worktree branches

### /batch for simple cases

if you don't need a coordinator orchestrating things, `/batch` is simpler:

```
/batch
1. add input validation to all API routes in src/routes/
2. convert utility files in src/utils/ from commonjs to esm
3. add jsdoc comments to all exported functions in src/lib/
```

each task runs in its own worktree. use `/batch` for "do these 5 things independently." use full agent teams when the coordinator needs to synthesize results.

---

## cost considerations

agent teams are expensive. each teammate has its own context window.

| role | model | est. cost |
|---|---|---|
| coordinator | sonnet | ~$0.40 |
| researcher | haiku | ~$0.09 |
| implementer | sonnet | ~$2.30 |
| test-writer | sonnet | ~$1.75 |
| **total** | | **~$4.54** |

a single sonnet doing all this sequentially might cost $3-4 bc it reuses context. teams pay the context-loading tax per teammate.

**saving money:**
- haiku for research teammates (~19x cheaper on input)
- sonnet for implementation
- keep teams to 2-3 (5 is almost never justified)
- scope prompts tightly -- tell teammates exactly which directories to touch

---

## anti-patterns

**spawning agents for simple grep/glob** -- if you can do it with 1-3 tool calls, just do it. spawning a subagent to search for lodash imports is like hiring a contractor to flip a light switch.

**chaining dependent agents in parallel** -- agent B can't see agent A's results. run them sequentially if B depends on A.

**using opus for quick lookups** -- don't spin up the most expensive model to read a package.json. use haiku or just read the file yourself.

**over-delegating** -- each subagent has startup cost and token overhead. if a task takes 30 seconds and one tool call, do it inline.

---

## subagent prompting tips

the prompt is everything bc the agent can't ask follow-up questions:

1. **front-load context** -- the agent starts with zero knowledge
2. **be specific about output** -- "refactor the auth module" is vague; specify exact function names and patterns
3. **specify file paths** -- don't make the agent guess where files go
4. **set boundaries** -- "only modify files in src/auth/. do not touch src/routes/"
5. **describe the end state** -- "when done, all TypeScript files should compile without errors"

<!-- [FILL: add your personal agent experience. which pattern do you use most? -->
<!-- any agent teams that failed spectacularly? what's your typical team size?] -->

---

## further reading

- [example agents](../examples/agents/) -- watch-tests, try-worktree, arch-review, write-pr
- [official docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents) -- subagent reference
