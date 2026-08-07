# contributing

contributions should make the field guide more accurate, more useful in practice, or easier to maintain.

## useful contributions

- corrections backed by a primary source.
- hands-on results with a reproducible environment and date.
- clearer distinctions between a surface, harness, model, and orchestration layer.
- security or installation fixes for legacy tools during the compatibility window.

## out of scope

- vendor benchmark roundups without workflow evidence.
- generated comparison prose or translated mirrors.
- new features for the frozen `cc`, `lore`, or `time` plugins.
- promotional claims, referral links, or rankings based on sponsorship.

## pull request standard

1. explain the user decision the change improves.
2. link every new product fact to an official source and add it to `docs/sources.json`.
3. label hands-on observations, source-verified facts, and inference correctly.
4. run the publication checks and any relevant legacy compatibility tests.
5. keep one logical change per commit and explain why it belongs in the repository.

security reports should follow [SECURITY.md](./SECURITY.md).

## verification

```bash
bun install --frozen-lockfile
python3 .github/scripts/check_sources.py
bun run check:field-runs
bun run check
bun run build
bun run test:site
```

changes under `plugins/` or `hooks/` must also preserve the compatibility suite:

```bash
bun test plugins/cc/tests
python3 -m pytest plugins/lore/tests
```
