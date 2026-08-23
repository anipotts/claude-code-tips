#!/usr/bin/env python3
"""Decide whether a change requires the full archive compatibility suite."""

from __future__ import annotations

import argparse
import subprocess


FULL_SUITE_PREFIXES = (
    ".claude-plugin/",
    ".github/scripts/check_archive_surface.py",
    ".github/scripts/compatibility_scope.py",
    ".github/workflows/plugin-smoke-test.yml",
    "bun.lock",
    "examples/",
    "hooks/",
    "plugins/",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--head")
    parser.add_argument("paths", nargs="*")
    return parser.parse_args()


def changed_paths(args: argparse.Namespace) -> list[str]:
    if args.paths:
        return args.paths
    if not args.base or not args.head:
        raise SystemExit("provide paths or both --base and --head")
    output = subprocess.check_output(
        ["git", "diff", "--name-only", args.base, args.head], text=True
    )
    return output.splitlines()


def needs_full_suite(paths: list[str]) -> bool:
    return any(path == prefix or path.startswith(prefix) for path in paths for prefix in FULL_SUITE_PREFIXES)


def main() -> int:
    paths = changed_paths(parse_args())
    print(f"full={'true' if needs_full_suite(paths) else 'false'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
