#!/usr/bin/env python3
"""
_upstream_utils.py -- Shared helpers for upstream collector scripts.

Provides state management, content hashing, HTML stripping, HTTP config,
and common collector functions (releases, tags, commits) used across
collect_official.py, collect_competitive.py, and collect_community.py.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
HEADERS: dict[str, str] = {"Accept": "application/vnd.github+json"}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"

STATE_FILE = Path(".github/state/last_check.json")

USER_AGENT = "claude-code-tips-watcher/1.0 (github.com/anipotts/claude-code-tips)"

# default timeout for all HTTP requests (seconds)
REQUEST_TIMEOUT = 15


# ---------------------------------------------------------------------------
# state management
# ---------------------------------------------------------------------------

def content_hash(text: str) -> str:
    """SHA-256 hash of text, truncated to 16 chars."""
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def strip_html(html: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    text = re.sub(r'<[^>]+>', ' ', html)
    return re.sub(r'\s+', ' ', text).strip()


def load_state() -> dict:
    """Load persisted state from disk."""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    """Persist state to disk, creating parent dirs if needed."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ---------------------------------------------------------------------------
# GitHub Actions output helper
# ---------------------------------------------------------------------------

def set_github_output(has_changes: bool) -> None:
    """Write has_changes output for GitHub Actions (or print for local runs)."""
    value = "true" if has_changes else "false"
    github_output = os.environ.get("GITHUB_OUTPUT", "")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"has_changes={value}\n")
    else:
        print(f"has_changes={value}")


# ---------------------------------------------------------------------------
# common collectors
# ---------------------------------------------------------------------------

def check_releases(owner: str, repo: str, state: dict, tier: int = 1) -> list[dict]:
    """Check for new releases/tags on a GitHub repo."""
    key = f"{owner}/{repo}/releases"
    last_seen = state.get(key, "")

    url = f"https://api.github.com/repos/{owner}/{repo}/releases"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 5}, timeout=REQUEST_TIMEOUT)

    if resp.status_code == 404:
        return check_tags(owner, repo, state, tier=tier)

    if resp.status_code != 200:
        print(f"  WARN: {url} returned {resp.status_code}", file=sys.stderr)
        return []

    releases = resp.json()
    if not releases:
        return check_tags(owner, repo, state, tier=tier)

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
            "body": (rel.get("body") or "")[:3000],
            "url": rel.get("html_url", ""),
            "published": rel.get("published_at", ""),
            "tier": tier,
        })

    if releases:
        state[key] = releases[0].get("tag_name", "")

    return changes


def check_tags(owner: str, repo: str, state: dict, tier: int = 1) -> list[dict]:
    """Fallback: check tags if no releases exist."""
    key = f"{owner}/{repo}/tags"
    last_seen = state.get(key, "")

    url = f"https://api.github.com/repos/{owner}/{repo}/tags"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 5}, timeout=REQUEST_TIMEOUT)

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
            "tier": tier,
        })

    if tags:
        state[key] = tags[0].get("name", "")

    return changes


def check_commits(owner: str, repo: str, state: dict, tier: int = 2) -> list[dict]:
    """Check for new commits on default branch."""
    key = f"{owner}/{repo}/commits"
    last_seen = state.get(key, "")

    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    resp = requests.get(url, headers=HEADERS, params={"per_page": 10}, timeout=REQUEST_TIMEOUT)

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
            "tier": tier,
        })

    if commits:
        state[key] = commits[0].get("sha", "")

    return changes
