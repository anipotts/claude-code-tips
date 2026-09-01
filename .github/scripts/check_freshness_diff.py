#!/usr/bin/env python3
"""Reject unsupported files and deletions in an automated freshness draft."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ALLOWED_FILES = {
    "README.md",
    "editorial/sources.json",
}
ALLOWED_PREFIXES = ("content/handbook/", "content/guides/")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="HEAD")
    return parser.parse_args()


def git_lines(*args: str) -> list[str]:
    output = subprocess.check_output(["git", *args], cwd=ROOT, text=True)
    return [line for line in output.splitlines() if line]


def allowed(path: str) -> bool:
    return path in ALLOWED_FILES or (
        path.endswith(".md") and path.startswith(ALLOWED_PREFIXES)
    )


def validation_errors(changed: set[str], deleted: set[str]) -> list[str]:
    errors: list[str] = []
    for path in sorted(changed):
        if not allowed(path):
            errors.append(f"unsupported changed path: {path}")
        if Path(path).name == "recommendations.md":
            errors.append(f"freshness drafts cannot change recommendations: {path}")
        candidate = ROOT / path
        if candidate.is_symlink():
            errors.append(f"symlinks are unsupported in freshness drafts: {path}")
    for path in sorted(deleted):
        errors.append(f"freshness drafts cannot delete files: {path}")
    return errors


def main() -> int:
    base = parse_args().base
    changed = set(git_lines("diff", "--name-only", base))
    changed.update(git_lines("ls-files", "--others", "--exclude-standard"))
    deleted = set(git_lines("diff", "--name-only", "--diff-filter=D", base))
    errors = validation_errors(changed, deleted)

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    print(f"freshness diff check passed for {len(changed)} changed paths")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
