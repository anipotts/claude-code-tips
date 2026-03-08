#!/usr/bin/env python3
"""
notify.py -- Send notifications when upstream changes are detected.

Supports multiple notification backends (configure via env vars):
  1. Twilio SMS   -- real SMS to your phone ($1/mo + pennies per msg)
  2. ntfy.sh      -- free push notifications, no account needed
  3. Both         -- set both sets of env vars

Usage: called from GitHub Actions after a draft PR is created.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def send_twilio_sms(message: str, pr_url: str) -> bool:
    """Send SMS via Twilio. Requires TWILIO_* secrets."""
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_number = os.environ.get("TWILIO_FROM_NUMBER", "")
    to_number = os.environ.get("NOTIFY_PHONE_NUMBER", "")

    if not all([account_sid, auth_token, from_number, to_number]):
        print("  Twilio: missing env vars, skipping", file=sys.stderr)
        return False

    import requests

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    resp = requests.post(url, auth=(account_sid, auth_token), data={
        "From": from_number,
        "To": to_number,
        "Body": message,
    })

    if resp.status_code in (200, 201):
        print(f"  Twilio: SMS sent to {to_number}")
        return True
    else:
        print(f"  Twilio: failed ({resp.status_code}): {resp.text[:200]}", file=sys.stderr)
        return False


def send_ntfy(message: str, pr_url: str, title: str) -> bool:
    """Send push notification via ntfy.sh. Free, no account needed."""
    topic = os.environ.get("NTFY_TOPIC", "")

    if not topic:
        print("  ntfy: no NTFY_TOPIC set, skipping", file=sys.stderr)
        return False

    import requests

    resp = requests.post(
        f"https://ntfy.sh/{topic}",
        data=message,
        headers={
            "Title": title,
            "Priority": "high",
            "Tags": "robot,claude",
            "Click": pr_url,
            "Actions": f"view, Open PR, {pr_url}",
        },
    )

    if resp.status_code == 200:
        print(f"  ntfy: notification sent to topic '{topic}'")
        return True
    else:
        print(f"  ntfy: failed ({resp.status_code})", file=sys.stderr)
        return False


def main():
    changes_file = Path("/tmp/upstream_changes.json")
    if not changes_file.exists():
        print("no changes file found", file=sys.stderr)
        sys.exit(0)

    changes = json.loads(changes_file.read_text())
    if not changes:
        print("no changes to notify about")
        sys.exit(0)

    pr_url = os.environ.get("PR_URL", "")
    pr_number = os.environ.get("PR_NUMBER", "")

    # build notification message
    sources = set(c["source"] for c in changes)
    release_changes = [c for c in changes if c["type"] == "release"]
    other_changes = [c for c in changes if c["type"] != "release"]

    lines = [f"claude code tips: {len(changes)} upstream changes detected"]

    if release_changes:
        versions = [c["version"] for c in release_changes]
        lines.append(f"releases: {', '.join(versions)}")

    if other_changes:
        types = set(c["type"] for c in other_changes)
        lines.append(f"also: {', '.join(types)}")

    if pr_url:
        lines.append(f"draft PR: {pr_url}")
        lines.append("review + merge when ready")

    message = "\n".join(lines)
    title = f"Claude Code: {len(changes)} updates"

    print(f"\n=== Notification ===\n{message}\n")

    # try all configured backends
    sent = False
    sent |= send_twilio_sms(message, pr_url)
    sent |= send_ntfy(message, pr_url, title)

    if not sent:
        print("WARNING: no notification backend configured!", file=sys.stderr)
        print("Set TWILIO_* secrets for SMS or NTFY_TOPIC for free push notifications.", file=sys.stderr)
        print("See .github/NOTIFICATIONS.md for setup instructions.", file=sys.stderr)


if __name__ == "__main__":
    main()
