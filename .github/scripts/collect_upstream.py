#!/usr/bin/env python3
"""
collect_upstream.py -- Poll upstream sources for Claude Code changes.

Checks:
  1. anthropics/claude-code GitHub releases/tags
  2. Claude Code changelog (docs.anthropic.com RSS or raw page)
  3. shanraisshan/claude-code-best-practice commits
  4. Trending Claude Code repos via GitHub search
  5. Official docs structure changes (hash-based)
  6. Competitor releases (openai codex, cursor, gemini CLI)
  7. Community signals (reddit, hacker news)

Tier classification:
  tier 1: official releases, docs changes, competitor releases -- auto-merge
  tier 2: community content, trending repos, blog posts -- needs human review

Writes collected changes to /tmp/upstream_changes.json
Sets GitHub Actions outputs: has_changes=true|false, max_tier=1|2

State file (.github/state/last_check.json) tracks what we've already seen
so we only surface genuinely new changes.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
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

# official docs -- monitor for structure changes (tier 1)
OFFICIAL_DOCS_URL = "https://docs.anthropic.com/en/docs/claude-code/overview"

USER_AGENT = "claude-code-tips-watcher/1.0 (github.com/anipotts/claude-code-tips)"

# default timeout for all HTTP requests (seconds)
REQUEST_TIMEOUT = 15

# competitor sources (tier 1 -- objective data, auto-merge)
COMPETITOR_SOURCES = [
    {
        "name": "openai_codex",
        "url": "https://api.github.com/repos/openai/codex/releases",
        "check": "releases",
        "tier": 1,
    },
    {
        "name": "cursor_changelog",
        "url": "https://raw.githubusercontent.com/getcursor/cursor/main/CHANGELOG.md",
        "check": "changelog_hash",
        "tier": 1,
    },
    {
        "name": "gemini",
        "url": "https://api.github.com/repos/google-gemini/gemini-cli/releases",
        "check": "releases",
        "tier": 1,
    },
]

# community sources (tier 2 -- needs human review)
COMMUNITY_SOURCES = [
    {
        "name": "reddit_claude",
        "url": "https://www.reddit.com/r/ClaudeAI/search.json?q=claude+code&sort=top&t=week&limit=5",
        "tier": 2,
    },
    {
        "name": "hackernews",
        "url": "https://hn.algolia.com/api/v1/search?query=%22Claude+Code%22&tags=story&numericFilters=points>10&hitsPerPage=5",
        "tier": 2,
    },
]

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
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ---------------------------------------------------------------------------
# collectors
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
            "body": (rel.get("body") or "")[:3000],  # cap size
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
        resp = requests.get(raw_url, timeout=REQUEST_TIMEOUT, headers={
            "User-Agent": USER_AGENT,
        })
        if resp.status_code == 200:
            text = resp.text
        else:
            # fallback to docs page
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

    # grab first ~3000 chars of content
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


def check_competitor_releases(state: dict) -> list[dict]:
    """Check competitor sources for new releases or changelog changes."""
    all_changes: list[dict] = []

    for source in COMPETITOR_SOURCES:
        name = source["name"]
        url = source["url"]
        check_type = source["check"]
        tier = source["tier"]

        print(f"  Checking competitor: {name}...")

        try:
            if check_type == "releases":
                key = f"competitor/{name}/releases"
                last_seen = state.get(key, "")

                resp = requests.get(url, headers=HEADERS, timeout=15)
                if resp.status_code != 200:
                    print(f"    WARN: {url} returned {resp.status_code}", file=sys.stderr)
                    continue

                releases = resp.json()
                if not isinstance(releases, list) or not releases:
                    continue

                for rel in releases:
                    tag = rel.get("tag_name", "")
                    if tag == last_seen:
                        break
                    all_changes.append({
                        "source": f"competitor/{name}",
                        "type": "competitor_release",
                        "version": tag,
                        "title": f"{name}: {rel.get('name', tag)}",
                        "body": (rel.get("body") or "")[:2000],
                        "url": rel.get("html_url", ""),
                        "published": rel.get("published_at", ""),
                        "tier": tier,
                    })

                if releases:
                    state[key] = releases[0].get("tag_name", "")

            elif check_type == "changelog_hash":
                key = f"competitor/{name}/hash"
                last_hash = state.get(key, "")

                resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers={
                    "User-Agent": USER_AGENT,
                })
                if resp.status_code != 200:
                    print(f"    WARN: {url} returned {resp.status_code}", file=sys.stderr)
                    continue

                chash = content_hash(resp.text)
                if chash == last_hash:
                    continue

                state[key] = chash
                all_changes.append({
                    "source": f"competitor/{name}",
                    "type": "competitor_changelog",
                    "version": chash,
                    "title": f"{name}: changelog updated",
                    "body": resp.text[:2000],
                    "url": url,
                    "published": datetime.now(timezone.utc).isoformat(),
                    "tier": tier,
                })

        except Exception as e:
            print(f"    WARN: competitor {name} check failed: {e}", file=sys.stderr)
            continue

    return all_changes


def check_community(state: dict) -> list[dict]:
    """Check community sources (reddit, HN) for relevant discussions."""
    all_changes: list[dict] = []

    for source in COMMUNITY_SOURCES:
        name = source["name"]
        url = source["url"]
        tier = source["tier"]
        key = f"community/{name}/seen"
        seen = set(state.get(key, []))

        print(f"  Checking community: {name}...")

        try:
            headers = {"User-Agent": USER_AGENT}
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)

            if resp.status_code != 200:
                print(f"    WARN: {url} returned {resp.status_code}", file=sys.stderr)
                continue

            data = resp.json()

            if name == "reddit_claude":
                posts = data.get("data", {}).get("children", [])
                for post in posts:
                    pdata = post.get("data", {})
                    post_id = pdata.get("id", "")
                    if post_id in seen:
                        continue
                    seen.add(post_id)
                    all_changes.append({
                        "source": f"community/{name}",
                        "type": "reddit_post",
                        "version": post_id,
                        "title": pdata.get("title", "")[:200],
                        "body": (pdata.get("selftext") or "")[:1000],
                        "url": f"https://reddit.com{pdata.get('permalink', '')}",
                        "published": "",
                        "tier": tier,
                    })

            elif name == "hackernews":
                hits = data.get("hits", [])
                for hit in hits:
                    story_id = str(hit.get("objectID", ""))
                    if story_id in seen:
                        continue
                    seen.add(story_id)
                    all_changes.append({
                        "source": f"community/{name}",
                        "type": "hn_story",
                        "version": story_id,
                        "title": hit.get("title", "")[:200],
                        "body": (hit.get("story_text") or "")[:1000],
                        "url": hit.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
                        "published": hit.get("created_at", ""),
                        "tier": tier,
                    })

        except Exception as e:
            print(f"    WARN: community {name} check failed: {e}", file=sys.stderr)
            continue

        state[key] = sorted(seen)[:100]  # cap stored list

    return all_changes


def check_trending(state: dict) -> list[dict]:
    """Find trending Claude Code repos via GitHub search."""
    key = "trending/seen_repos"
    seen = set(state.get(key, []))

    from datetime import timedelta
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    query = f'"claude code" OR "claude-code" pushed:>{week_ago}'
    url = "https://api.github.com/search/repositories"
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": 10,
    }

    resp = requests.get(url, headers=HEADERS, params=params, timeout=REQUEST_TIMEOUT)
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
            "tier": 2,
        })

    state[key] = sorted(seen)[:200]  # cap stored list

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

    # check official docs
    print("\nChecking official docs...")
    docs_changes = check_official_docs(state)
    print(f"  Found {len(docs_changes)} changes")
    all_changes.extend(docs_changes)

    # check competitor releases
    print("\nChecking competitor sources...")
    competitor_changes = check_competitor_releases(state)
    print(f"  Found {len(competitor_changes)} competitor changes")
    all_changes.extend(competitor_changes)

    # check community signals
    print("\nChecking community sources...")
    community_changes = check_community(state)
    print(f"  Found {len(community_changes)} community signals")
    all_changes.extend(community_changes)

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

    # determine routing tier -- use most cautious (highest number) when mixed
    # tier 1 = auto-merge (objective facts), tier 2 = needs review (subjective)
    # if ANY change needs review, the whole batch goes through review
    route_tier = 0
    if all_changes:
        route_tier = max(c.get("tier", 2) for c in all_changes)

    tier_counts = {}
    for c in all_changes:
        t = c.get("tier", 2)
        tier_counts[t] = tier_counts.get(t, 0) + 1
    if tier_counts:
        print(f"Tier breakdown: {tier_counts}")

    # set GitHub Actions outputs
    has_changes = "true" if all_changes else "false"
    github_output = os.environ.get("GITHUB_OUTPUT", "")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"has_changes={has_changes}\n")
            f.write(f"route_tier={route_tier}\n")
    else:
        # local testing
        print(f"has_changes={has_changes}")
        print(f"route_tier={route_tier}")


if __name__ == "__main__":
    main()
