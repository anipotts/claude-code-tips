<!-- tested with: claude code v2.1.122 -->

# monitor

watch a background process and react to its output line by line, without blocking anything. the first event-driven tool in claude code.

shipped april 9 2026. requires v2.1.98+. announced by alistair (claude code team). his tweet hit 127k views bc people have been duct-taping this with tmux and file queues for months.

## the three modes, compared

shipped april 9 2026. requires v2.1.98+. now stable and mature across current versions (v2.1.98+, tested with v2.1.122).



**platform availability (v2.1.98+)**

**platform availability (v2.1.98+ through v2.1.205)**: monitor is stable on claude.ai and direct API. bedrock, vertex AI, and microsoft foundry support status may have changed in v2.1.205 -- run `/doctor` to verify availability on your platform before relying on monitor for production workflows.

## stream filter vs poll filter

monitor has two modes depending on what you're watching.

**stream filter**: for processes that continuously emit output (log tailing, dev servers, test runners). claude writes a script that pipes stdout through a filter. only matching lines become events.

```
"start npm run dev and monitor for errors"
→ claude filters for: error, warn, failed, ECONNREFUSED
→ you keep working. errors stream in as they happen.
```

**poll filter**: for things you need to check periodically (APIs, endpoints, deploy status). claude writes a script that polls at an interval and only emits when a condition is met.

```
"monitor our health endpoint every 30s, alert if status != 200"
→ zero events while healthy
→ instant notification when it breaks
```

ray amjad's analogy nails it: a security camera that only alerts on motion. the camera is always running, but you only pay attention (tokens) when something moves.

## the parameters

monitor takes four things:

| parameter | what it does |
|-----------|-------------|
| `description` | what you're watching and why |
| `command` | the shell command claude writes to do the watching |
| `filter` | stream_filter (real-time) or poll_filter (interval-based): determines what counts as an event |
| `timeout` / `persistent` | how long to watch, and whether it survives across turns |

you don't configure these manually. tell claude what to watch in plain english and it writes the command + filter. the parameters exist under the hood.

## when to use monitor vs background

```
process finishes in <30 seconds?
  → run_in_background. monitor overhead isn't worth it.

need to react to intermediate output (errors, warnings, partial results)?
  → monitor with stream_filter.

checking a condition periodically (API health, deploy status, file drops)?
  → monitor with poll_filter.

just need the final result and nothing in between?
  → run_in_background. simpler, cheaper.

watching something for hours while you work on other stuff?
  → monitor. it costs nothing when idle.
```

## what this actually changes

monitor is a bigger deal than it looks. from a tweet reply that got it right:

> "the quiet implication is that claude code is becoming event-driven instead of poll-driven. that's a much bigger primitive than the tool itself. once the agent can react to streams instead of asking 'is it done yet' in a loop, a whole class of long-running workflows opens up."
> - @jatingargiitk

before monitor, the only way to watch something was `/loop`, which is time-driven. it fires a prompt every N minutes, each iteration is a full API call. monitor is event-driven: the script runs continuously, tokens are consumed only when something actually happens.

this also works in the agent SDK, not just the CLI. so if you're building autonomous agents, they can now react to external events natively.

**platform support (v2.1.98+, tested v2.1.122)**: monitor is stable on claude.ai and direct API. bedrock, vertex AI, and microsoft foundry support remains unconfirmed -- run `/doctor` on your current version to verify availability on your platform.

## vs /loop

| | monitor | /loop |
|---|---------|-------|
| trigger | event (stdout line matches filter) | time (every N minutes) |
| cost when idle | zero | full API call each iteration |
| blocking | no | no |
| best for | watching processes, reacting to changes | periodic check-ins, recurring prompts |
| debouncing | yes (built-in) | N/A (fires on schedule) |

use both: monitor for real-time watching, /loop for scheduled maintenance passes. they're complementary.

## try it

1. start a dev server and watch for errors: `"start npm run dev and use the monitor tool to watch for any errors or warnings while I work on the auth feature"`. then browse your app and trigger a bug. watch claude catch it mid-stream.

2. set up a deploy watcher: `"monitor our vercel deployment logs for the next hour, alert me if error rate spikes above 5 per minute"`. walk away. come back when something breaks.

3. combine with a subagent: spawn one agent to implement a feature, and tell the main session to monitor the test output. the implementer writes code, monitor catches test failures as they happen, and the main session can coordinate.

---

[subagents →](./subagents.md) · [hooks v2 →](./hooks-v2.md) · [context management →](./context-management.md)

---


### platform support (v2.1.98+)

monitor is available on anthropic API and claude.ai subscriptions. it is not yet available on bedrock, vertex AI, or microsoft foundry. if you're using claude code through a cloud provider integration, check the provider's documentation to confirm monitor support before relying on it in automation.
