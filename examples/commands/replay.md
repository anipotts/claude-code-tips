---
name: replay
description: generate a VHS tape replay of session file changes
allowed-tools:
  - Bash
  - Read
  - Write
---

# /replay

generates an animated GIF showing every file mutation from a session, in order. uses VHS tape format

## examples

```
/replay                → replay the most recent session
/replay abc123         → replay a specific session ID
```

## how it works

1. finds the replay log in ~/.claude/replay/ (most recent, or by session ID)
2. reads the JSONL mutation log captured by replay-capture.sh hook
3. generates a .tape file with animated cat commands for each changed file
4. runs vhs to produce a GIF
5. reports the output path

requires: [vhs](https://github.com/charmbracelet/vhs) (`brew install vhs`), replay-capture.sh hook active

`````
When the user runs /replay, generate an animated session replay GIF from the replay capture log.

## Step 1: Find the replay log

The argument (if any) is a session ID. Check for replay logs:

```bash
REPLAY_DIR=~/.claude/replay
if [ ! -d "$REPLAY_DIR" ]; then
  echo "NO_REPLAY_DIR"
  exit 0
fi
# list available logs, most recent first
ls -t "$REPLAY_DIR"/*.jsonl 2>/dev/null | head -10
```

- If NO_REPLAY_DIR: tell the user "no replay data found -- make sure the replay-capture.sh hook is registered in your settings"
- If the user gave a session ID argument, look for `~/.claude/replay/SESSION_ID.jsonl`
- If no argument, use the most recently modified .jsonl file
- If no .jsonl files exist: tell the user "no replay logs found -- the hook may not have captured any Edit/Write calls yet"

## Step 2: Read the replay log

Read the selected .jsonl file. Parse key info:

```bash
LOG_FILE="<selected file>"
SESSION_ID=$(basename "$LOG_FILE" .jsonl)
ENTRY_COUNT=$(wc -l < "$LOG_FILE" | tr -d ' ')
FIRST_TS=$(head -1 "$LOG_FILE" | jq -r '.ts')
LAST_TS=$(tail -1 "$LOG_FILE" | jq -r '.ts')
UNIQUE_FILES=$(jq -r '.file' "$LOG_FILE" | sort -u | wc -l | tr -d ' ')
echo "SESSION=$SESSION_ID ENTRIES=$ENTRY_COUNT FILES=$UNIQUE_FILES FIRST=$FIRST_TS LAST=$LAST_TS"
cat "$LOG_FILE"
```

Calculate session duration from first to last timestamp. Format as MM:SS.

## Step 3: Generate the VHS tape file

Write a .tape file to `gifs/replay-SESSION_ID.tape` with this structure:

```tape
# replay-SESSION_ID.tape -- session replay animation
# Record: vhs gifs/replay-SESSION_ID.tape

Output gifs/replay-SESSION_ID.gif
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set FontSize 13
Set Width 1200
Set Height 600
Set Padding 20
Set TypingSpeed 20ms

# title card
Type "# Session Replay: SESSION_ID"
Enter
Type "# N files changed across M mutations in MM:SS"
Enter
Type "#"
Enter
Sleep 1s

# for each mutation entry in chronological order:
Type "# [TOOL] FILE_PATH (N lines)"
Enter
Type "cat -n FILE_PATH | head -20"
Enter
Sleep 300ms

# ... repeat for each mutation ...

# summary card
Type "#"
Enter
Type "# replay complete: M mutations across N files"
Enter
Sleep 2s
```

Rules for generating the tape:
- One section per mutation entry from the JSONL log, in chronological order
- Show the tool name and file path as a comment before each cat command
- Use `cat -n FILE | head -20` to preview each file (first 20 lines with line numbers)
- 300ms sleep between mutations for readable pacing
- If the same file appears multiple times, show it each time (it changed between mutations)
- Cap at 50 mutations max -- if more, show first 25 and last 25 with a skip note
- Title card at top, summary at bottom

Write the .tape file using the Write tool.

## Step 4: Run VHS

```bash
if ! command -v vhs &>/dev/null; then
  echo "VHS_NOT_INSTALLED"
  exit 0
fi
vhs gifs/replay-SESSION_ID.tape
```

- If VHS_NOT_INSTALLED: tell the user "vhs not found -- install with `brew install vhs` then run `vhs gifs/replay-SESSION_ID.tape`"
- If vhs succeeds: report the output GIF path

## Step 5: Report

Tell the user:
- the GIF path: `gifs/replay-SESSION_ID.gif`
- the tape source: `gifs/replay-SESSION_ID.tape`
- summary: N mutations, N unique files, session duration
- note they can re-run `vhs gifs/replay-SESSION_ID.tape` to regenerate

## Rules

- Read-only on the replay log -- never modify .jsonl files
- The .tape file goes in gifs/ to match repo conventions
- If a referenced file no longer exists on disk, still include it in the tape (cat will show an error, which is informative)
- Keep output compact
- Do not generate the GIF during capture -- only on-demand via this command
`````
