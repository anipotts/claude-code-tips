<!-- tested with: claude code v2.1.94 -->

# plan mode

stop claude from writing code until you both agree on what to build. toggle with `/plan`.

## what it does

plan mode changes claude's behavior. instead of reading code and immediately editing files, it reads code, asks questions, designs an approach, and writes the plan to a file. no edits happen until you approve.

during planning, claude uses explore and plan agents to read your codebase, map dependencies, and identify the files it needs to touch. the plan itself gets written to a markdown file in your project (usually something like `PLAN.md` or embedded in the conversation). you review it, push back, adjust scope, then give the green light.

the key shift: planning moves the expensive mistakes to before any code is written. a bad plan costs you 2 minutes of reading. a bad first implementation costs you 15 minutes of rollback and re-prompting.

## when it helps

complex multi-file changes. architecture decisions. anything where the wrong first step is expensive to undo.

plan mode shines when you need alignment. if you're not 100% sure how claude will interpret your request, planning forces it to show its hand first. you catch misunderstandings before they become 200-line diffs in the wrong direction.

good candidates:
- refactors that touch 5+ files
- new feature implementation with unclear boundaries
- anything involving database schema changes
- tasks where you'd normally write a design doc first

## when to skip it

simple tasks where planning is overhead. bug fixes where you need action now. single-file changes where "fix it" is faster than "plan how to fix it."

if the plan would be longer than the implementation, you planned too much. plan mode works best for 30-60 min tasks. for 5 min tasks, just let claude go.

## the over-planning trap

i've seen this pattern: someone enables plan mode for everything, then wonders why sessions feel slow. planning has a cost. every minute spent planning is a minute not spent building.

the test is simple. if you read the plan and think "yeah, obviously," you didn't need the plan. save plan mode for tasks where the approach genuinely isn't obvious.

[FILL: percentage of my sessions that use plan mode, and the types of tasks i reserve it for]

## try it

1. pick a task that touches 3+ files. type `/plan` before your prompt
2. read the plan claude produces. push back on anything that feels wrong
3. approve and watch it execute. compare the quality to sessions where you skipped planning

[session workflow &rarr;](../session-workflow.md)
