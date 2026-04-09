<!-- tested with: claude code v2.1.94 -->

# plan mode

stop claude from writing code until you both agree on what to build. toggle with `/plan`.

## what it does

plan mode changes claude's behavior. instead of reading code and immediately editing files, it reads code, asks questions, designs an approach, and writes the plan to a file. no edits happen until you approve.

during planning, claude uses explore and plan agents to read your codebase, map dependencies, and identify the files it needs to touch. the plan itself gets written to a markdown file in your project. you review it, push back, adjust scope, then give the green light.

the key shift: planning moves the expensive mistakes to before any code is written. a bad plan costs you 2 minutes of reading. a bad first implementation costs you 15 minutes of rollback and re-prompting.

## use it for almost everything

i literally start most of my sessions in plan mode. it's my global default. you should use plan mode for almost everything. if you're even debating whether to use plan mode, you should probably use plan mode.

good candidates:
- refactors that touch 3+ files
- new feature implementation with unclear boundaries
- anything involving database schema changes
- tasks where you'd normally write a design doc first
- any multi-step task where the approach isn't immediately obvious

plan mode forces Claude to think before acting, which means fewer wrong turns, fewer compactions, and fewer wasted sessions.

## the only exception

the only time you skip plan mode is when the task is so simple you already know exactly which file to edit and exactly how to check it. single-line fix, typo correction, "add this import." those don't need a plan. if you can describe the entire change in one sentence, just let claude go.

## try it

1. pick a task that touches 3+ files. type `/plan` before your prompt
2. read the plan claude produces. push back on anything that feels wrong
3. approve and watch it execute. compare the quality to sessions where you skipped planning

[session workflow &rarr;](../session-workflow.md)
