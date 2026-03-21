#!/usr/bin/env python3
"""
collect_competitive.py -- Poll competitor sources for changes.

Sources (all tier 1):
  - openai/codex releases
  - cursor changelog (hash-based)
  - google-gemini/gemini-cli releases

Writes collected changes to /tmp/competitive_changes.json
Sets GitHub Actions outputs: has_changes=true|false
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

from _upstream_utils import (
    HEADERS,
    USER_AGENT,
    REQUEST_TIMEOUT,
    content_hash,
    load_state,
    save_state,
    set_github_output,
)

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------

OUTPUT_FILE = Path("/tmp/competitive_changes.json")

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


# ---------------------------------------------------------------------------
# collector
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    state = load_state()

    print("=== Competitive Sources Collector ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")

    print("\nChecking competitor sources...")
    all_changes = check_competitor_releases(state)
    print(f"  Found {len(all_changes)} competitor changes")

    # save state
    save_state(state)

    # write output
    OUTPUT_FILE.write_text(json.dumps(all_changes, indent=2))
    print(f"\nTotal changes: {len(all_changes)}")

    # set GitHub Actions outputs
    set_github_output(bool(all_changes))


if __name__ == "__main__":
    main()
