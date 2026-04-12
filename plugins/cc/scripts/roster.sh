#!/usr/bin/env bash
# roster.sh — show all active Claude Code sessions
# Usage: roster.sh [cwd]
exec python3 "$(dirname "$0")/../hooks/cc.py" roster-cli "${1:-$(pwd)}"
