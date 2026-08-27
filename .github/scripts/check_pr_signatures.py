#!/usr/bin/env python3
"""Fail pull request validation before merge when GitHub cannot verify a commit."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def main() -> int:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    repository = os.environ.get("GITHUB_REPOSITORY")
    token = os.environ.get("GITHUB_TOKEN")
    if not event_path or not repository or not token:
        print("GitHub pull request context is unavailable; signature provider check skipped")
        return 0

    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    pull_request = event.get("pull_request")
    if not pull_request:
        print("event is not a pull request; signature provider check skipped")
        return 0

    api = os.environ.get("GITHUB_API_URL", "https://api.github.com")
    number = int(pull_request["number"])
    failures: list[str] = []
    commit_count = 0

    for page in range(1, 101):
        url = f"{api}/repos/{repository}/pulls/{number}/commits?per_page=100&page={page}"
        request = Request(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        try:
            with urlopen(request, timeout=30) as response:
                commits = json.load(response)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            print(f"GitHub signature verification request failed: {exc}", file=sys.stderr)
            return 1
        if not commits:
            break

        commit_count += len(commits)
        for commit in commits:
            verification = commit.get("commit", {}).get("verification") or {}
            if verification.get("verified") is not True:
                failures.append(f"{commit.get('sha', 'unknown')}: {verification.get('reason', 'unverified')}")
        if len(commits) < 100:
            break

    if commit_count == 0:
        print("GitHub returned no pull request commits to verify", file=sys.stderr)
        return 1

    if failures:
        print("GitHub rejected these commit signatures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        print("Use a GitHub-associated committer identity or GitHub-native commit creation.", file=sys.stderr)
        return 1

    print(f"GitHub verified all {commit_count} pull request commit signatures")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
