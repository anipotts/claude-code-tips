<!-- tested with: claude code v2.1.122 -->

# ultrathink

force claude code into extended thinking mode for complex problems. more thinking tokens = better reasoning on hard tasks.

## how to use it

add "ultrathink" anywhere in your prompt:

```
ultrathink: design the database schema for a multi-tenant SaaS with row-level security
```

or at the start of a complex request:

```
ultrathink

i need to refactor the auth module to support OAuth2 + SAML.
current setup is in src/auth/. don't break existing JWT flows.
```



## workflows: the next step beyond ultrathink

v2.1.154 introduces dynamic workflows: ask claude to create a workflow and it orchestrates work across tens to hundreds of agents in the background. workflows are the evolution beyond individual extended thinking sessions.

use workflows for:
- tasks that benefit from parallel agent execution
- large codebases that need multiple agents exploring different modules
- multi-stage work (explore → plan → implement → test → review)

start with `/workflows` to see your active runs. ultrathink remains useful for single complex queries; workflows handle orchestration across many queries.

## when it helps

- architecture decisions with multiple tradeoffs
- complex multi-file refactors where you need a plan first
- debugging subtle issues where the first intuition is usually wrong
- any prompt where you'd say "think carefully about this"

## when it doesn't help

- simple file edits, renames, or config changes
- tasks where you already know exactly what you want
- exploratory reads (grep, glob, read)

## what it actually does

claude code's extended thinking allocates more compute to reasoning before generating a response. the model "thinks out loud" internally, exploring multiple approaches before committing to one. you don't see the thinking tokens but you benefit from the better output.



note: ultrathink triggers extended thinking in claude's reasoning chain. temperature=0 (deterministic mode) still applies -- ultrathink and determinism are orthogonal. multiple calls with identical prompts and ultrathink enabled may produce different reasoning paths even at temperature=0.

## try it

next time you're about to ask claude for something complex, prefix it with "ultrathink" and compare the quality of the plan. you'll notice it considers more edge cases and catches tradeoffs you didn't mention.
