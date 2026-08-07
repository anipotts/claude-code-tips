#!/usr/bin/env python3
"""Validate the public source registry and optional freshness constraints."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs" / "sources.json"
REQUIRED_FIELDS = {
    "id",
    "product",
    "layer",
    "status",
    "url",
    "last_checked",
    "evidence",
}
LAYERS = {"surface", "harness", "model", "orchestration"}
EVIDENCE = {"hands-on", "source-verified", "inference", "retired"}
MAX_AGE_DAYS = {"pricing": 14, "core": 30, "watchlist": 45, "stable": 90}
GUIDE_PATHS = [
    ROOT / "docs" / "codex" / "README.md",
    ROOT / "docs" / "claude-code" / "README.md",
    ROOT / "docs" / "shared" / "operating-system.md",
    ROOT / "docs" / "market" / "README.md",
    ROOT / "docs" / "market" / "hardware.md",
    ROOT / "docs" / "methodology.md",
    ROOT / "docs" / "legacy-tools.md",
]
GUIDE_FIELDS = {"products", "last_verified", "evidence", "source_ids"}
GUIDE_META = re.compile(r"<!-- guide-meta: (\{.*\}) -->")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--freshness",
        action="store_true",
        help="also enforce review windows and current package versions",
    )
    return parser.parse_args()


def load_registry() -> dict:
    with REGISTRY.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_registry(data: dict, freshness: bool) -> list[str]:
    errors: list[str] = []
    today = date.today()

    if data.get("schema_version") != 1:
        errors.append("schema_version must be 1")

    sources = data.get("sources")
    if not isinstance(sources, list) or not sources:
        return errors + ["sources must be a non-empty list"]

    seen: set[str] = set()
    for index, source in enumerate(sources):
        label = source.get("id", f"source[{index}]")
        missing = REQUIRED_FIELDS - source.keys()
        if missing:
            errors.append(f"{label}: missing fields {sorted(missing)}")
            continue

        if source["id"] in seen:
            errors.append(f"{label}: duplicate id")
        seen.add(source["id"])

        if source["layer"] not in LAYERS:
            errors.append(f"{label}: invalid layer {source['layer']!r}")
        if source["evidence"] not in EVIDENCE:
            errors.append(f"{label}: invalid evidence {source['evidence']!r}")
        if source["status"] not in MAX_AGE_DAYS:
            errors.append(f"{label}: invalid status {source['status']!r}")

        parsed_url = urlparse(source["url"])
        if parsed_url.scheme != "https" or not parsed_url.netloc:
            errors.append(f"{label}: url must be an absolute https url")

        try:
            checked = date.fromisoformat(source["last_checked"])
        except ValueError:
            errors.append(f"{label}: invalid last_checked date")
            continue

        if checked > today:
            errors.append(f"{label}: last_checked is in the future")
        if freshness:
            max_age = MAX_AGE_DAYS[source["status"]]
            age = (today - checked).days
            if age > max_age:
                errors.append(f"{label}: {age} days old, limit is {max_age}")

    if freshness:
        expected = data.get("product_versions", {})
        observed = {
            "codex": os.environ.get("LATEST_CODEX"),
            "claude_code": os.environ.get("LATEST_CLAUDE_CODE"),
        }
        for product, version in observed.items():
            if version and version != "unknown" and expected.get(product) != version:
                errors.append(
                    f"{product}: registry has {expected.get(product)!r}, upstream has {version!r}"
                )

    return errors


def validate_guides(data: dict) -> list[str]:
    errors: list[str] = []
    known_sources = {source["id"] for source in data.get("sources", [])}
    today = date.today()

    for path in GUIDE_PATHS:
        relative = path.relative_to(ROOT)
        if not path.exists():
            errors.append(f"{relative}: guide file is missing")
            continue

        match = GUIDE_META.search(path.read_text(encoding="utf-8"))
        if not match:
            errors.append(f"{relative}: guide-meta comment is missing")
            continue

        try:
            metadata = json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            errors.append(f"{relative}: invalid guide-meta json: {exc}")
            continue

        missing = GUIDE_FIELDS - metadata.keys()
        if missing:
            errors.append(f"{relative}: missing guide metadata {sorted(missing)}")
        for field in ("products", "evidence", "source_ids"):
            if not isinstance(metadata.get(field), list):
                errors.append(f"{relative}: {field} must be a list")

        if not metadata.get("products"):
            errors.append(f"{relative}: products must not be empty")
        unknown_evidence = set(metadata.get("evidence", [])) - EVIDENCE
        if unknown_evidence:
            errors.append(f"{relative}: unknown evidence labels {sorted(unknown_evidence)}")

        unknown = set(metadata.get("source_ids", [])) - known_sources
        if unknown:
            errors.append(f"{relative}: unknown source ids {sorted(unknown)}")

        try:
            verified = date.fromisoformat(metadata.get("last_verified", ""))
        except ValueError:
            errors.append(f"{relative}: invalid last_verified date")
        else:
            if verified > today:
                errors.append(f"{relative}: last_verified is in the future")

    return errors


def main() -> int:
    args = parse_args()
    try:
        data = load_registry()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"source registry could not be read: {exc}", file=sys.stderr)
        return 1

    errors = validate_registry(data, args.freshness)
    errors.extend(validate_guides(data))
    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    mode = "freshness" if args.freshness else "structure"
    print(f"source registry {mode} check passed for {len(data['sources'])} sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
