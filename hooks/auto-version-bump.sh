#!/usr/bin/env bash
# auto-version-bump.sh — bumps mine plugin version on commits that touch plugin files
# register as a PreToolUse hook matching Bash(git push*) or use as git pre-push hook
#
# tested with: claude code v2.1.81
set -euo pipefail

PLUGIN_JSON="plugins/mine/.claude-plugin/plugin.json"

# only run if plugin.json exists
if [[ ! -f "$PLUGIN_JSON" ]]; then
  exit 0
fi

# check if any staged/committed changes touch the mine plugin
MINE_CHANGES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep "^plugins/mine/" || true)
if [[ -z "$MINE_CHANGES" ]]; then
  exit 0
fi

# skip if the only change IS the version bump itself
if [[ "$MINE_CHANGES" == "plugins/mine/.claude-plugin/plugin.json" ]]; then
  exit 0
fi

# read current version
CURRENT=$(python3 -c "import json; print(json.load(open('$PLUGIN_JSON'))['version'])")

# bump patch version
NEW=$(python3 -c "
parts = '$CURRENT'.split('.')
parts[2] = str(int(parts[2]) + 1)
print('.'.join(parts))
")

# write new version
python3 -c "
import json
with open('$PLUGIN_JSON') as f:
    d = json.load(f)
d['version'] = '$NEW'
with open('$PLUGIN_JSON', 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
"

echo "[mine] version bumped: $CURRENT → $NEW"
