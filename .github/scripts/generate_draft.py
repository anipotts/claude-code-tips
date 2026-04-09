#!/usr/bin/env python3
"""
generate_draft.py -- Process upstream changes through Claude API (Haiku).

Reads /tmp/official_changes.json (from collect_official.py), sends changes
to Claude Haiku, and:
  1. Cross-references changes against existing tips to flag staleness
  2. Proposes edits to actual docs files (shows in PR diff)
  3. Writes PR body summary

Cost:
  - Uses claude-haiku-4-5-20251001 ($1/MTok in, $5/MTok out)
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

# files to check for official changes (matches actual repo structure)
CHANGES_FILES = [
    Path("/tmp/official_changes.json"),
    Path("/tmp/upstream_changes.json"),  # backwards compat
]

# ---------------------------------------------------------------------------
# processing
# ---------------------------------------------------------------------------

def read_existing_docs() -> dict[str, str]:
    """Read current state of docs and tips for context."""
    docs = {}
    # actual repo structure
    paths = list((REPO_ROOT / "docs").rglob("*.md"))
    paths += list((REPO_ROOT / "docs" / "tips").rglob("*.md"))
    paths += list((REPO_ROOT / "docs" / "comparisons").rglob("*.md"))

    seen = set()
    for path in paths:
        rel = str(path.relative_to(REPO_ROOT))
        if rel in seen:
            continue
        seen.add(rel)
        if path.exists():
            lines = path.read_text().splitlines()[:100]
            docs[rel] = "\n".join(lines)

    return docs


def build_prompt(changes: list[dict], existing_docs: dict[str, str]) -> str:
    """Build the processing prompt."""

    changes_text = ""
    for i, change in enumerate(changes, 1):
        changes_text += f"\n---\n### change {i}: [{change['type']}] {change['title']}\n"
        changes_text += f"source: {change['source']}\n"
        changes_text += f"url: {change['url']}\n"
        if change.get('body'):
            body = change['body'][:2000]
            changes_text += f"content:\n{body}\n"

    if len(changes_text) > MAX_INPUT_CHARS:
        changes_text = changes_text[:MAX_INPUT_CHARS] + "\n\n[truncated]"

    docs_context = ""
    for path, content in sorted(existing_docs.items()):
        docs_context += f"\n--- {path} (first 100 lines) ---\n{content}\n"

    return f"""you are updating the claude-code-tips repo (github.com/anipotts/claude-code-tips).

this repo has:
- docs/tips/ -- 12 standalone tips (fast-mode, plan-mode, subagents, plugins, hooks-v2, mcp-integration, context-management, prompt-caching, safety-hooks, session-length, settings-hierarchy, ultrathink)
- docs/ -- guides (hooks.md, agents.md, automation.md, cost.md, mistakes.md, session-workflow.md, worktrees.md)
- docs/comparisons/ -- competitor comparisons (cursor, codex, gemini, antigravity, pricing)
- hooks/ -- 9 standalone bash hook scripts
- examples/ -- agents, commands, plugins

current state of docs:
{docs_context}

upstream changes detected:
{changes_text}

do two things:

1. CROSS-REFERENCE: for each change, check if any existing tip or doc makes claims
   that are now outdated. list these as staleness flags.

2. PROPOSE EDITS: if a change is significant (new feature, breaking change, pricing
   update), propose a concrete edit to the relevant doc.

output a JSON object with two keys:

{{
  "staleness": [
    {{
      "file": "docs/tips/fast-mode.md",
      "claim": "what the doc currently says",
      "reality": "what changed upstream",
      "severity": "high|medium|low"
    }}
  ],
  "edits": [
    {{
      "file": "docs/tips/plan-mode.md",
      "section": "## use it for almost everything",
      "action": "append|replace|add_section",
      "content": "new markdown content",
      "reason": "one-line explanation"
    }}
  ]
}}

rules:
- lowercase voice. practical. no fluff. "bc" not "because"
- only flag genuinely meaningful staleness (not cosmetic)
- only propose edits for useful changes (new features, breaking changes, pricing)
- skip trivial stuff (typos, minor dep bumps, internal refactors)
- ONLY output valid JSON. no markdown fences, no explanation outside JSON
- if nothing meaningful changed, output: {{"staleness": [], "edits": []}}"""


def process_changes(changes: list[dict]) -> dict:
    """Send changes to Claude Haiku and get proposed edits + staleness flags."""
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
        result = json.loads(response_text)
        if not isinstance(result, dict):
            result = {"staleness": [], "edits": []}
    except json.JSONDecodeError:
        print(f"WARNING: could not parse response as JSON", file=sys.stderr)
        print(f"Response: {response_text[:500]}", file=sys.stderr)
        result = {"staleness": [], "edits": []}

    return result


def validate_edits(edits: list[dict]) -> list[dict]:
    """Validate proposed edits before applying. Returns only valid edits."""
    valid = []
    file_cache: dict[str, str] = {}

    for i, edit in enumerate(edits):
        if not isinstance(edit, dict):
            continue
        file_str = edit.get("file", "")
        file_path = REPO_ROOT / file_str
        action = edit.get("action", "")
        section = edit.get("section", "")
        content = edit.get("content", "")
        reason = edit.get("reason", "")

        allowed_prefixes = ("docs/", "examples/")
        if not any(file_str.startswith(p) for p in allowed_prefixes):
            print(f"  VALIDATE SKIP [{i}]: {file_str} outside allowed dirs", file=sys.stderr)
            continue

        try:
            resolved = file_path.resolve()
            if not resolved.is_relative_to(REPO_ROOT.resolve()):
                print(f"  VALIDATE SKIP [{i}]: path traversal", file=sys.stderr)
                continue
        except (ValueError, OSError):
            continue

        if not file_path.exists():
            print(f"  VALIDATE SKIP [{i}]: {file_path} does not exist", file=sys.stderr)
            continue

        if not content.strip():
            continue

        if action not in ("append", "replace", "add_section"):
            continue

        if file_str not in file_cache:
            file_cache[file_str] = file_path.read_text()
        current = file_cache[file_str]

        if action in ("replace", "append") and section:
            if section not in current:
                print(f"  VALIDATE SKIP [{i}]: section not found in {file_path}", file=sys.stderr)
                continue

        print(f"  VALIDATE OK [{i}]: {file_str} ({action}) -- {reason}")
        valid.append(edit)

    print(f"\nValidation: {len(valid)}/{len(edits)} edits passed")
    return valid


def apply_edits(edits: list[dict]) -> list[str]:
    """Apply proposed edits to docs files. Returns list of modified files."""
    modified = []

    for edit in edits:
        file_path = REPO_ROOT / edit.get("file", "")
        action = edit.get("action", "")
        content = edit.get("content", "")
        section = edit.get("section", "")

        if not file_path.exists() or not content.strip():
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


def write_pr_body(changes: list[dict], result: dict, modified: list[str]) -> None:
    """Write the PR description with staleness flags and proposed edits."""
    sources = set(c["source"] for c in changes)
    staleness = result.get("staleness", [])
    edits = result.get("edits", [])

    body = f"""## upstream changes detected

**sources:** {', '.join(sorted(sources))}
**changes found:** {len(changes)}
**files edited:** {len(modified)}
**staleness flags:** {len(staleness)}

### what changed upstream

"""
    for c in changes:
        body += f"- **[{c['type']}]** {c['title']} ([link]({c['url']}))\n"

    if staleness:
        body += f"\n### staleness flags\n\n"
        body += "| file | claim | reality | severity |\n"
        body += "|---|---|---|---|\n"
        for s in staleness:
            body += f"| `{s.get('file', '')}` | {s.get('claim', '')} | {s.get('reality', '')} | {s.get('severity', '')} |\n"

    if edits:
        body += f"\n### proposed edits\n\n"
        for edit in edits:
            body += f"- `{edit.get('file', '')}`: {edit.get('reason', 'update')}\n"

    body += """
### review checklist

- [ ] check staleness flags -- do any tips need manual updates?
- [ ] check the diff -- does the voice match?
- [ ] verify any version numbers or pricing mentioned
- [ ] merge when ready, or close if not useful

*auto-generated by official-watcher. edit freely before merging.*
"""
    PR_BODY_FILE.write_text(body)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    # try both file names for backwards compat
    changes = []
    for changes_file in CHANGES_FILES:
        if changes_file.exists():
            changes = json.loads(changes_file.read_text())
            print(f"Read {len(changes)} changes from {changes_file}")
            break

    if not changes:
        print("no changes to process")
        sys.exit(0)

    print(f"Processing {len(changes)} changes through {MODEL}...")

    result = process_changes(changes)
    staleness = result.get("staleness", [])
    edits = result.get("edits", [])

    print(f"Haiku found {len(staleness)} staleness flags and proposed {len(edits)} edits")

    modified = []
    if edits:
        print("\nValidating edits...")
        edits = validate_edits(edits)
        if edits:
            modified = apply_edits(edits)
            print(f"Modified {len(modified)} files: {modified}")
        else:
            print("No valid edits after validation")

    write_pr_body(changes, result, modified)
    print(f"PR body written to {PR_BODY_FILE}")


if __name__ == "__main__":
    main()
