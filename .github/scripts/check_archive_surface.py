#!/usr/bin/env python3
"""Validate archived documentation links and compatibility promises."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_ROOTS = (ROOT / "hooks", ROOT / "plugins", ROOT / "examples")
CANONICAL_ARCHIVE = ROOT / "docs" / "archive.md"
LINK_PATTERN = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)")
INSTALL_COMMANDS = (
    "/plugin marketplace add anipotts/claude-code-tips",
    "/plugin install cc@anipotts",
    "/plugin install lore@anipotts",
    "/plugin install time@anipotts",
)
STALE_TARGETS = ("docs/legacy-tools.md", "docs/claude-code/README.md")


def archive_readmes() -> list[Path]:
    patterns = []
    for root in ARCHIVE_ROOTS:
        relative = root.relative_to(ROOT)
        patterns.extend((str(relative / "README.md"), str(relative / "**" / "README.md")))
    output = subprocess.check_output(
        ["git", "ls-files", "--", *patterns], cwd=ROOT, text=True
    )
    return [ROOT / line for line in output.splitlines() if line]


def relative_target(source: Path, raw_target: str) -> Path | None:
    target = unquote(raw_target.strip("<>"))
    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc or target.startswith(("#", "/")):
        return None
    return (source.parent / parsed.path).resolve()


def main() -> int:
    errors: list[str] = []
    readmes = archive_readmes()

    for readme in readmes:
        text = readme.read_text(encoding="utf-8")
        for stale in STALE_TARGETS:
            if stale in text:
                errors.append(f"{readme.relative_to(ROOT)}: stale link target {stale}")
        for match in LINK_PATTERN.finditer(text):
            target = relative_target(readme, match.group(1))
            if target is not None and not target.exists():
                errors.append(
                    f"{readme.relative_to(ROOT)}: missing relative link {match.group(1)}"
                )

    canonical_text = CANONICAL_ARCHIVE.read_text(encoding="utf-8")
    normalized = " ".join(canonical_text.split())
    if "november 5, 2026" not in normalized:
        errors.append("docs/archive.md: exact november 5, 2026 promise is missing")
    if "legacy-tools-final-2026-11-05" not in canonical_text:
        errors.append("docs/archive.md: exact final archive tag is missing")
    for command in INSTALL_COMMANDS:
        if command not in canonical_text:
            errors.append(f"docs/archive.md: installation path is missing: {command}")

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    print(
        f"archive surface check passed for {len(readmes)} readmes and "
        f"{len(INSTALL_COMMANDS)} installation paths"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
