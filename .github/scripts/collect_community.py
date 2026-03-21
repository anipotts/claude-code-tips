#!/usr/bin/env python3
"""
collect_community.py -- Poll community sources for Claude Code signals.

Sources (all tier 2):
  - Reddit r/ClaudeAI (top posts mentioning "claude code")
  - Hacker News stories mentioning "Claude Code"
  - Trending GitHub repos related to Claude Code

Writes collected changes to /tmp/community_changes.json
Sets GitHub Actions outputs: has_changes=true|false
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

from _upstream_utils import (
    HEADERS,
    USER_AGENT,
    REQUEST_TIMEOUT,
    load_state,
    save_state,
    set_github_output,
)

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

OUTPUT_FILE = Path("/tmp/community_changes.json")

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
# collectors
# ---------------------------------------------------------------------------

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

def main() -> None:
    state = load_state()
    all_changes: list[dict] = []

    print("=== Community Sources Collector ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")

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

    # set GitHub Actions outputs
    set_github_output(bool(all_changes))


if __name__ == "__main__":
    main()
