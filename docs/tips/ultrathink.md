<!-- tested with: claude code v2.1.77 -->

# ultrathink

force claude code into extended thinking mode for complex problems. more thinking tokens = better reasoning on hard tasks.

## how to use it

add "ultrathink" anywhere in your prompt:

```
ultrathink — design the database schema for a multi-tenant SaaS with row-level security
```

or at the start of a complex request:

```
ultrathink

i need to refactor the auth module to support OAuth2 + SAML.
current setup is in src/auth/. don't break existing JWT flows.
```

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

## try it

next time you're about to ask claude for something complex, prefix it with "ultrathink" and compare the quality of the plan. you'll notice it considers more edge cases and catches tradeoffs you didn't mention.
