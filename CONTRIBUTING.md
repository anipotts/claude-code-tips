# contributing

tips, fixes, and new content are welcome. this repo is opinionated and practical -- contributions should be too.

## what we're looking for

- **tips** -- tested claude code workflows, shortcuts, or patterns
- **hooks/plugins/agents** -- working code, not concepts
- **guide corrections** -- if something is wrong or outdated, fix it
- **example configs** -- CLAUDE.md files, settings.json, rules/

## how to contribute

1. fork the repo
2. make your changes on a branch
3. open a PR with a short description of what changed and why

## style guide

- lowercase voice. no title case in headings
- "bc" not "because", "--" not em dashes
- practical over theoretical. if it's not tested, don't submit it
- keep docs under 300 lines. split into separate files if longer
- all hook scripts use `#!/usr/bin/env bash` with `set -euo pipefail`

## what we don't accept

- AI-generated content that hasn't been tested or edited
- promotional links or affiliate content
- changes to gitignored files (content/, data/, AUDIT.md)
