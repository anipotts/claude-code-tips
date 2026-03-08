#!/usr/bin/env python3
"""
collect_upstream.py -- Poll upstream sources for Claude Code changes.

Checks:
  1. anthropics/claude-code GitHub releases/tags
  2. Claude Code changelog (docs.anthropic.com RSS or raw page)
  3. shanraisshan/claude-code-best-practice commits
  4. Trending Claude Code repos via GitHub search

Writes collected changes to /tmp/upstream_changes.json
Sets GitHub Actions output: has_changes=true|false

State file (.github/state/last_check.json) tracks what we've already seen
so we only surface genuinely new changes.
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
HEADERS = {"Accept": "application/vnd.github+json"}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"

STATE_FILE = Path(".github/state/last_check.json")
OUTPUT_FILE = Path("/tmp/upstream_changes.json")

# sources to watch
WATCHED_REPOS = [
    {
        "owner": "anthropics",
        "repo": "claude-code",
        "check": "releases",      # check releases/tags
    },
    {
        "owner": "shanraisshan",
        "repo": "claude-code-best-practice",
        "check": "commits",        # check recent commits
    },
    {
        "owner": "marckrenn",
        "repo": "claude-code-changelog",
        "check": "commits",        # tracks system prompt diffs, feature flags
    },
]

# GitHub search query for trending claude code repos
# searches repos created/pushed in last 7 days with "claude code" in name/desc
TRENDING_QUERY = '"claude code" OR "claude-code" in:name,description pushed:>{week_ago}"'

# ---------------------------------------------------------------------------
# state management
# ---------------------------------------------------------------------------

def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ---------------------------------------------------------------------------
# collectors
# ---------------------------------------------------------------------------

def check_releases(owner: str, repo: str, state: dict) -> list[dict]:
    """Check for new releases/tags on a GitHub repo."""
    key = f"{owner}/{repo}/releases"
    last_seen = state.get(key, "")

    url = f"https://api.github.com/repos/{owner}/{repo}/releases"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 5})

    if resp.status_code == 404:
        # repo might not use releases -- fall back to tags
        return check_tags(owner, repo, state)

    if resp.status_code != 200:
        print(f"  WARN: {url} returned {resp.status_code}", file=sys.stderr)
        return []

    releases = resp.json()
    if not releases:
        return check_tags(owner, repo, state)

    changes = []
    for rel in releases:
        tag = rel.get("tag_name", "")
        if tag == last_seen:
            break
        changes.append({
            "source": f"{owner}/{repo}",
            "type": "release",
            "version": tag,
            "title": rel.get("name", tag),
            "body": (rel.get("body") or "")[:3000],  # cap size
            "url": rel.get("html_url", ""),
            "published": rel.get("published_at", ""),
        })

    if releases:
        state[key] = releases[0].get("tag_name", "")

    return changes


def check_tags(owner: str, repo: str, state: dict) -> list[dict]:
    """Fallback: check tags if no releases exist."""
    key = f"{owner}/{repo}/tags"
    last_seen = state.get(key, "")

    url = f"https://api.github.com/repos/{owner}/{repo}/tags"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 5})

    if resp.status_code != 200:
        print(f"  WARN: {url} returned {resp.status_code}", file=sys.stderr)
        return []

    tags = resp.json()
    changes = []
    for tag in tags:
        name = tag.get("name", "")
        if name == last_seen:
            break
        changes.append({
            "source": f"{owner}/{repo}",
            "type": "tag",
            "version": name,
            "title": name,
            "body": "",
            "url": f"https://github.com/{owner}/{repo}/releases/tag/{name}",
            "published": "",
        })

    if tags:
        state[key] = tags[0].get("name", "")

    return changes


def check_commits(owner: str, repo: str, state: dict) -> list[dict]:
    """Check for new commits on default branch."""
    key = f"{owner}/{repo}/commits"
    last_seen = state.get(key, "")

    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 10})

    if resp.status_code != 200:
        print(f"  WARN: {url} returned {resp.status_code}", file=sys.stderr)
        return []

    commits = resp.json()
    changes = []
    for commit in commits:
        sha = commit.get("sha", "")
        if sha == last_seen:
            break
        msg = commit.get("commit", {}).get("message", "")
        changes.append({
            "source": f"{owner}/{repo}",
            "type": "commit",
            "version": sha[:8],
            "title": msg.split("\n")[0][:120],
            "body": msg[:1000],
            "url": commit.get("html_url", ""),
            "published": commit.get("commit", {}).get("author", {}).get("date", ""),
        })

    if commits:
        state[key] = commits[0].get("sha", "")

    return changes


def check_changelog(state: dict) -> list[dict]:
    """
    Check Claude Code CHANGELOG.md from the official repo.

    Uses the raw markdown file from GitHub (more reliable than scraping
    the rendered docs page). Falls back to the docs page if raw fetch fails.
    """
    key = "anthropic/changelog"
    # primary: raw CHANGELOG.md from the repo (structured markdown)
    raw_url = "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"
    # fallback: rendered docs page
    docs_url = "https://docs.anthropic.com/en/docs/claude-code/changelog"

    text = ""
    source_url = raw_url

    try:
        resp = requests.get(raw_url, timeout=15, headers={
            "User-Agent": "claude-code-tips-watcher/1.0"
        })
        if resp.status_code == 200:
            text = resp.text
        else:
            # fallback to docs page
            resp = requests.get(docs_url, timeout=15, headers={
                "User-Agent": "claude-code-tips-watcher/1.0"
            })
            if resp.status_code == 200:
                import re
                text = re.sub(r'<[^>]+>', ' ', resp.text)
                text = re.sub(r'\s+', ' ', text).strip()
                source_url = docs_url
            else:
                print(f"  WARN: changelog returned {resp.status_code}", file=sys.stderr)
                return []
    except Exception as e:
        print(f"  WARN: changelog fetch failed: {e}", file=sys.stderr)
        return []

    import hashlib
    content_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
    last_hash = state.get(key, "")

    if content_hash == last_hash:
        return []

    state[key] = content_hash

    # grab first ~3000 chars of content
    return [{
        "source": "anthropic/changelog",
        "type": "changelog",
        "version": content_hash,
        "title": "Claude Code changelog updated",
        "body": text[:3000],
        "url": source_url,
        "published": datetime.now(timezone.utc).isoformat(),
    }]


def check_trending(state: dict) -> list[dict]:
    """Find trending Claude Code repos via GitHub search."""
    key = "trending/seen_repos"
    seen = set(state.get(key, []))

    week_ago = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # search for recently-pushed repos about claude code, sorted by stars
    query = '"claude code" OR "claude-code" pushed:>2025-01-01'
    url = "https://api.github.com/search/repositories"
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": 10,
    }

    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        print(f"  WARN: search returned {resp.status_code}", file=sys.stderr)
        return []

    results = resp.json().get("items", [])
    changes = []

    for repo in results:
        full_name = repo.get("full_name", "")
        stars = repo.get("stargazers_count", 0)

        # skip our own repo and repos we've already seen
        if full_name in seen or full_name == "anipotts/claude-code-tips":
            continue

        # only surface repos with meaningful traction (>50 stars)
        if stars < 50:
            continue

        seen.add(full_name)
        changes.append({
            "source": "trending",
            "type": "trending_repo",
            "version": full_name,
            "title": f"{full_name} ({stars} stars)",
            "body": (repo.get("description") or "")[:500],
            "url": repo.get("html_url", ""),
            "published": repo.get("pushed_at", ""),
        })

    state[key] = list(seen)[:200]  # cap stored list

    return changes


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    state = load_state()
    all_changes: list[dict] = []

    print("=== Upstream Watcher ===")
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

    # check trending
    print("\nChecking trending repos...")
    trending_changes = check_trending(state)
    print(f"  Found {len(trending_changes)} new repos")
    all_changes.extend(trending_changes)

    # save state
    save_state(state)

    # write output
    OUTPUT_FILE.write_text(json.dumps(all_changes, indent=2))
    print(f"\nTotal changes: {len(all_changes)}")

    # set GitHub Actions output
    has_changes = "true" if all_changes else "false"
    github_output = os.environ.get("GITHUB_OUTPUT", "")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"has_changes={has_changes}\n")
    else:
        # local testing
        print(f"has_changes={has_changes}")


if __name__ == "__main__":
    main()
