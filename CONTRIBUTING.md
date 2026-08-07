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
4. run `python3 .github/scripts/check_sources.py` and the relevant code tests.
5. keep one logical change per commit and explain why it belongs in the repository.

security reports should follow [SECURITY.md](./SECURITY.md).
