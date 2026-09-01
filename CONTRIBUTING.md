# contributing

contributions should make the field guide more accurate, more useful in practice, or easier to maintain.

## useful contributions

- corrections backed by a primary source.
- tested results with a reproducible environment and date.
- clearer distinctions between a surface, harness, model, and orchestration layer.
- security or installation fixes for archived tools during the compatibility window.

## out of scope

- vendor benchmark roundups without workflow evidence.
- generated comparison prose or translated mirrors.
- new features for the frozen `cc`, `lore`, or `time` plugins.
- promotional claims, referral links, or rankings based on sponsorship.

## pull request standard

1. explain the user decision the change improves.
2. link every new product fact to an official source and add it to `docs/sources.json`.
3. label tested observations, official source facts, analysis, and open questions correctly.
4. run the publication checks and any relevant archive compatibility tests.
5. keep one logical change per commit and explain why it belongs in the repository.

security reports should follow [SECURITY.md](./SECURITY.md).

## edit the site

public writing stays in ordinary source files:

- `content/home.md` owns the homepage.
- `docs/guides/*.md`, `docs/history.md`, `docs/market.md`, and `docs/method.md` own the handbook.
- `content/runs/*.md` owns field run pages.
- `src/site.ts` owns shared navigation and interface labels.
- `docs/sources.json` owns source metadata and evidence labels.

run `bun run edit` from the worktree you want to change, then review and edit the canonical source in the local copy review workspace. Astro updates the rendered route during development. Run `bun run verify` before opening the pull request. A protected merge to `main` publishes the static site through GitHub Pages.

## verification

```bash
bun install --frozen-lockfile
bun run verify
```

changes under `plugins/` or `hooks/` must also preserve the compatibility suite:

```bash
bun test plugins/cc/tests
python3 -m pytest plugins/lore/tests
```
