#!/usr/bin/env python3
"""
collect_official.py -- Poll official Claude Code sources for changes.

Sources (all tier 1):
  - anthropics/claude-code releases/tags
  - Claude Code CHANGELOG.md (raw from GitHub, fallback to docs page)
  - Official docs page (hash-based structure change detection)
  - shanraisshan/claude-code-best-practice commits
  - marckrenn/claude-code-changelog commits

Writes collected changes to /tmp/official_changes.json
Sets GitHub Actions outputs: has_changes=true|false
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

from _upstream_utils import (
    USER_AGENT,
    REQUEST_TIMEOUT,
    content_hash,
    strip_html,
    load_state,
    save_state,
    set_github_output,
    check_releases,
    check_commits,
)

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

OUTPUT_FILE = Path("/tmp/official_changes.json")

OFFICIAL_DOCS_URL = "https://code.claude.com/docs/en/overview"

WATCHED_REPOS = [
    {
        "owner": "anthropics",
        "repo": "claude-code",
        "check": "releases",
    },
    {
        "owner": "shanraisshan",
        "repo": "claude-code-best-practice",
        "check": "commits",
    },
    {
        "owner": "marckrenn",
        "repo": "claude-code-changelog",
        "check": "commits",
    },
]


# ---------------------------------------------------------------------------
# collectors
# ---------------------------------------------------------------------------

def check_changelog(state: dict) -> list[dict]:
    """
    Check Claude Code CHANGELOG.md from the official repo.

    Uses the raw markdown file from GitHub (more reliable than scraping
    the rendered docs page). Falls back to the docs page if raw fetch fails.
    """
    key = "anthropic/changelog"
    raw_url = "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"
    docs_url = "https://code.claude.com/docs/en/changelog"

    text = ""
    source_url = raw_url

    try:
        resp = requests.get(raw_url, timeout=REQUEST_TIMEOUT, headers={
            "User-Agent": USER_AGENT,
        })
        if resp.status_code == 200:
            text = resp.text
        else:
            resp = requests.get(docs_url, timeout=REQUEST_TIMEOUT, headers={
                "User-Agent": USER_AGENT,
            })
            if resp.status_code == 200:
                text = strip_html(resp.text)
                source_url = docs_url
            else:
                print(f"  WARN: changelog returned {resp.status_code}", file=sys.stderr)
                return []
    except Exception as e:
        print(f"  WARN: changelog fetch failed: {e}", file=sys.stderr)
        return []

    chash = content_hash(text)
    last_hash = state.get(key, "")

    if chash == last_hash:
        return []

    state[key] = chash

    return [{
        "source": "anthropic/changelog",
        "type": "changelog",
        "version": chash,
        "title": "Claude Code changelog updated",
        "body": text[:3000],
        "url": source_url,
        "published": datetime.now(timezone.utc).isoformat(),
        "tier": 1,
    }]


def check_official_docs(state: dict) -> list[dict]:
    """Monitor official claude code docs for structure changes (hash-based)."""
    key = "anthropic/official_docs"
    last_hash = state.get(key, "")

    try:
        resp = requests.get(OFFICIAL_DOCS_URL, timeout=REQUEST_TIMEOUT, headers={
            "User-Agent": USER_AGENT,
        })
        if resp.status_code != 200:
            print(f"  WARN: official docs returned {resp.status_code}", file=sys.stderr)
            return []
    except Exception as e:
        print(f"  WARN: official docs fetch failed: {e}", file=sys.stderr)
        return []

    text = strip_html(resp.text)
    chash = content_hash(text)

    if chash == last_hash:
        return []

    state[key] = chash
    return [{
        "source": "anthropic/official-docs",
        "type": "docs_change",
        "version": chash,
        "title": "Official Claude Code docs updated",
        "body": text[:3000],
        "url": OFFICIAL_DOCS_URL,
        "published": datetime.now(timezone.utc).isoformat(),
        "tier": 1,
    }]


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    state = load_state()
    all_changes: list[dict] = []

    print("=== Official Sources Collector ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")

    # check watched repos
    for repo_cfg in WATCHED_REPOS:
        owner = repo_cfg["owner"]
        repo = repo_cfg["repo"]
        check_type = repo_cfg["check"]
        print(f"\nChecking {owner}/{repo} ({check_type})...")

        if check_type == "releases":
            changes = check_releases(owner, repo, state)
        elif check_type == "commits":
            changes = check_commits(owner, repo, state)
        else:
            changes = []

        print(f"  Found {len(changes)} new changes")
        all_changes.extend(changes)

    # check changelog
    print("\nChecking Claude Code changelog...")
    changelog_changes = check_changelog(state)
    print(f"  Found {len(changelog_changes)} changes")
    all_changes.extend(changelog_changes)

    # check official docs
    print("\nChecking official docs...")
    docs_changes = check_official_docs(state)
    print(f"  Found {len(docs_changes)} changes")
    all_changes.extend(docs_changes)

    # save state
    save_state(state)

    # write output
    OUTPUT_FILE.write_text(json.dumps(all_changes, indent=2))
    print(f"\nTotal changes: {len(all_changes)}")

    # set GitHub Actions outputs
    set_github_output(bool(all_changes))


if __name__ == "__main__":
    main()
