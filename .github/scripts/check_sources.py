#!/usr/bin/env python3
"""Validate evidence metadata and optionally check upstream freshness signals."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from datetime import date
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "docs" / "sources.json"
REQUIRED_SOURCE_FIELDS = {
    "id",
    "product",
    "layer",
    "status",
    "url",
    "last_checked",
    "evidence",
}
LAYERS = {"surface", "harness", "model", "orchestration"}
EVIDENCE = {"tested", "official-source", "analysis", "open-question"}
MAX_AGE_DAYS = {"pricing": 14, "core": 30, "watchlist": 45, "stable": 90}
WATCHED_STATUSES = {"core", "stable"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--freshness",
        action="store_true",
        help="enforce review windows, versions, and watched upstream terms",
    )
    return parser.parse_args()


def load_registry() -> dict:
    with REGISTRY.open(encoding="utf-8") as handle:
        return json.load(handle)


def normalized_upstream_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": "coding-agent-tips-freshness/1"})
    with urlopen(request, timeout=30) as response:
        raw = response.read().decode("utf-8", errors="replace")
    without_markup = re.sub(r"<[^>]+>", " ", html.unescape(raw))
    return re.sub(r"\s+", " ", without_markup).casefold()


def validate_registry(data: dict, freshness: bool) -> list[str]:
    errors: list[str] = []
    today = date.today()

    if data.get("schema_version") != 1:
        errors.append("schema_version must be 1")

    labels = data.get("evidence_labels")
    if not isinstance(labels, dict) or set(labels) != EVIDENCE:
        errors.append(f"evidence_labels must define {sorted(EVIDENCE)}")
    else:
        for label, definition in labels.items():
            if not isinstance(definition, dict) or not definition.get("label") or not definition.get("description"):
                errors.append(f"{label}: evidence label and description are required")

    sources = data.get("sources")
    if not isinstance(sources, list) or not sources:
        return errors + ["sources must be a non-empty list"]

    seen: set[str] = set()
    for index, source in enumerate(sources):
        label = source.get("id", f"source[{index}]")
        missing = REQUIRED_SOURCE_FIELDS - source.keys()
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

        watch = source.get("watch")
        if source["status"] in WATCHED_STATUSES:
            if not isinstance(watch, dict) or watch.get("kind") != "terms":
                errors.append(f"{label}: core and stable sources require a terms watch")
            elif not isinstance(watch.get("terms"), list) or not watch["terms"]:
                errors.append(f"{label}: watch terms must be a non-empty list")

        if freshness:
            max_age = MAX_AGE_DAYS[source["status"]]
            age = (today - checked).days
            if age > max_age:
                errors.append(f"{label}: {age} days old, limit is {max_age}")

            if watch:
                try:
                    upstream = normalized_upstream_text(source["url"])
                except (HTTPError, URLError, TimeoutError) as exc:
                    errors.append(f"{label}: upstream watch failed: {exc}")
                else:
                    missing_terms = [
                        term for term in watch["terms"] if term.casefold() not in upstream
                    ]
                    if missing_terms:
                        errors.append(
                            f"{label}: watched terms missing upstream {missing_terms}"
                        )

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


def main() -> int:
    args = parse_args()
    try:
        data = load_registry()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"source registry could not be read: {exc}", file=sys.stderr)
        return 1

    errors = validate_registry(data, args.freshness)
    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    mode = "freshness" if args.freshness else "structure"
    print(f"source registry {mode} check passed for {len(data['sources'])} sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
