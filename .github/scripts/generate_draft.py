#!/usr/bin/env python3
"""
generate_draft.py -- Process upstream changes through Claude API (Haiku).

Reads /tmp/upstream_changes.json (from collect_upstream.py), sends changes
to Claude Haiku, and:
  1. Proposes edits to actual docs files (shows in PR diff)
  2. Writes PR body summary

The PR diff shows exactly what changed in the docs. Drafts/analysis
stay out of the repo -- only instructional content gets committed.

Cost:
  - Uses claude-haiku-4-5-20250315 ($0.80/MTok in, $4/MTok out)
  - Single API call per run
  - Typical run: ~3000 input + ~2000 output tokens = ~$0.01
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import anthropic

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

MODEL = "claude-haiku-4-5-20251001"
MAX_INPUT_CHARS = 15000   # ~4000 tokens
PR_BODY_FILE = Path("/tmp/pr-body.md")
REPO_ROOT = Path(".")

# ---------------------------------------------------------------------------
# processing
# ---------------------------------------------------------------------------

def read_existing_docs() -> dict[str, str]:
    """Read current state of key docs files for context."""
    docs = {}
    files_to_read = [
        "docs/guide.md",
        "docs/hooks-guide.md",
        "docs/agent-teams.md",
        "docs/cost-analysis.md",
        "docs/mcp-servers.md",
    ]
    for f in files_to_read:
        path = REPO_ROOT / f
        if path.exists():
            # first 200 lines for structure context
            lines = path.read_text().splitlines()[:200]
            docs[f] = "\n".join(lines)
    return docs


def build_prompt(changes: list[dict], existing_docs: dict[str, str]) -> str:
    """Build the processing prompt."""

    changes_text = ""
    for i, change in enumerate(changes, 1):
        changes_text += f"\n---\n### change {i}: [{change['type']}] {change['title']}\n"
        changes_text += f"source: {change['source']}\n"
        changes_text += f"url: {change['url']}\n"
        if change['body']:
            body = change['body'][:2000]
            changes_text += f"content:\n{body}\n"

    if len(changes_text) > MAX_INPUT_CHARS:
        changes_text = changes_text[:MAX_INPUT_CHARS] + "\n\n[truncated]"

    docs_context = ""
    for path, content in existing_docs.items():
        docs_context += f"\n--- {path} (first 200 lines) ---\n{content}\n"

    return f"""you are updating the claude-code-tips repo (github.com/anipotts/claude-code-tips).

this repo has these docs:
- docs/guide.md -- comprehensive guide (beginner to advanced)
- docs/hooks-guide.md -- complete hooks reference
- docs/agent-teams.md -- agent teams guide
- docs/cost-analysis.md -- cost optimization guide
- docs/mcp-servers.md -- MCP server guide
- docs/subagent-patterns.md -- subagent patterns
- docs/plugin-creation.md -- plugin creation guide

current state of key files:
{docs_context}

upstream changes detected today:
{changes_text}

output a JSON array of file edits. each edit:
- "file": relative path (e.g., "docs/guide.md")
- "section": which section to update (e.g., "### 2. installing and first run")
- "action": "append" | "replace" | "add_section"
- "content": markdown content to add/replace
- "reason": one-line explanation

rules:
- lowercase voice. practical. no fluff. "bc" not "because".
- only edit for genuinely useful changes (new features, breaking changes)
- skip trivial stuff (typos, minor dep bumps)
- for new releases, focus on hooks, plugins, agents, CLI changes
- keep edits self-contained and useful to someone reading the guide
- ONLY output valid JSON. no markdown fences, no explanation outside JSON.
- if nothing meaningful changed, output: []

format:
[
  {{
    "file": "docs/guide.md",
    "section": "### 2. installing and first run",
    "action": "replace",
    "content": "updated content...",
    "reason": "install command changed"
  }}
]"""


def process_changes(changes: list[dict]) -> list[dict]:
    """Send changes to Claude Haiku and get proposed edits."""
    existing_docs = read_existing_docs()
    client = anthropic.Anthropic()

    prompt = build_prompt(changes, existing_docs)

    message = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()

    try:
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            response_text = response_text.rsplit("```", 1)[0]
        edits = json.loads(response_text)
        if not isinstance(edits, list):
            edits = []
    except json.JSONDecodeError:
        print(f"WARNING: could not parse response as JSON", file=sys.stderr)
        print(f"Response: {response_text[:500]}", file=sys.stderr)
        edits = []

    return edits


def apply_edits(edits: list[dict]) -> list[str]:
    """Apply proposed edits to docs files. Returns list of modified files."""
    modified = []

    for edit in edits:
        file_path = REPO_ROOT / edit.get("file", "")
        action = edit.get("action", "")
        content = edit.get("content", "")
        section = edit.get("section", "")

        if not file_path.exists():
            print(f"  SKIP: {file_path} does not exist", file=sys.stderr)
            continue

        if not content.strip():
            continue

        current = file_path.read_text()

        if action == "append":
            if section and section in current:
                idx = current.index(section)
                rest = current[idx + len(section):]
                next_section = _find_next_section(rest)

                if next_section != -1:
                    insert_at = idx + len(section) + next_section
                    updated = current[:insert_at] + "\n\n" + content + "\n" + current[insert_at:]
                else:
                    updated = current.rstrip() + "\n\n" + content + "\n"
            else:
                updated = current.rstrip() + "\n\n" + content + "\n"

        elif action == "add_section":
            updated = current.rstrip() + "\n\n---\n\n" + content + "\n"

        elif action == "replace":
            if section and section in current:
                idx = current.index(section)
                rest = current[idx + len(section):]
                next_section = _find_next_section(rest)

                if next_section != -1:
                    end = idx + len(section) + next_section
                    updated = current[:idx] + section + "\n\n" + content + "\n" + current[end:]
                else:
                    updated = current[:idx] + section + "\n\n" + content + "\n"
            else:
                print(f"  SKIP: section not found in {file_path}", file=sys.stderr)
                continue
        else:
            continue

        file_path.write_text(updated)
        modified.append(str(edit.get("file", "")))
        print(f"  EDIT: {edit.get('file')} ({action}) -- {edit.get('reason', '')}")

    return list(set(modified))


def _find_next_section(text: str) -> int:
    """Find the position of the next markdown heading in text."""
    best = -1
    for marker in ["\n## ", "\n### "]:
        pos = text.find(marker)
        if pos != -1 and (best == -1 or pos < best):
            best = pos
    return best


def write_pr_body(changes: list[dict], edits: list[dict], modified: list[str]) -> None:
    """Write the PR description."""
    sources = set(c["source"] for c in changes)

    body = f"""## upstream changes detected

**sources:** {', '.join(sorted(sources))}
**changes found:** {len(changes)}
**files edited:** {len(modified)}

### what changed upstream

"""
    for c in changes:
        body += f"- **[{c['type']}]** {c['title']} ([link]({c['url']}))\n"

    if edits:
        body += f"\n### proposed edits\n\n"
        for edit in edits:
            body += f"- `{edit.get('file', '')}`: {edit.get('reason', 'update')}\n"

    body += """
### review checklist

- [ ] check the diff -- does the voice match?
- [ ] verify any version numbers or pricing mentioned
- [ ] add your own perspective where useful
- [ ] merge when ready, or close if not useful

*auto-generated by upstream-watcher. edit freely before merging.*
"""
    PR_BODY_FILE.write_text(body)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    changes_file = Path("/tmp/upstream_changes.json")
    if not changes_file.exists():
        print("no changes file found", file=sys.stderr)
        sys.exit(0)

    changes = json.loads(changes_file.read_text())
    if not changes:
        print("no changes to process")
        sys.exit(0)

    print(f"Processing {len(changes)} changes through {MODEL}...")

    edits = process_changes(changes)
    print(f"Haiku proposed {len(edits)} edits")

    modified = []
    if edits:
        modified = apply_edits(edits)
        print(f"Modified {len(modified)} files: {modified}")

    write_pr_body(changes, edits, modified)
    print(f"PR body written to {PR_BODY_FILE}")


if __name__ == "__main__":
    main()
