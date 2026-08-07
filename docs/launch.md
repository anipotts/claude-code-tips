# public cutover runbook

this runbook separates the reviewable repository change from the external
mutations that follow final merge approval.

## launch identity

- repository: `anipotts/coding-agent-tips`
- site: `https://agents.anipotts.com`
- site name: `coding agent tips`
- description: `evidence-backed guidance for coding agents in production software, from individual projects to startups and big tech.`
- topics: `coding-agents`, `codex`, `claude-code`, `orchestration`, `local-models`, `developer-tools`, `field-research`

## before merge

1. publish `codex/field-guide-v4` and open the draft pull request.
2. let the stable validation and legacy compatibility checks finish.
3. attach current mobile and desktop homepage and guide screenshots.
4. review the concept-to-render ledger in `design-qa.md`.
5. confirm that current claude code claims remain source-verified and the paired
   hands-on run remains pending.
6. obtain final merge approval.

## after merge approval

1. merge without rewriting the signed commit history.
2. rename the repository to `coding-agent-tips` and confirm the old repository
   url redirects.
3. apply the description and topic set above.
4. select github actions as the pages source and set `agents.anipotts.com` as
   the custom domain in repository settings.
5. verify no exact `agents.anipotts.com` dns record belongs to another service.
6. if clear, add a dns-only cname from `agents` to `anipotts.github.io`.
7. wait for certificate issuance, then enable https and verify both the custom
   url and github pages redirect.
8. create the signed `v4.0.0` tag and publish the prepared release notes.
9. close the named legacy and automation issues with an individual explanation.
10. add the `main` ruleset requiring pull requests, signed commits, stable
    validation, and force-push and deletion protection, with no approval count.

github's current custom-domain guidance says to set the custom domain on the
pages site before changing dns. the actions-based publishing path does not need
a committed `CNAME` file, so this repository intentionally omits one.

## production proof

the launch is complete only when all of these are observed:

- `https://agents.anipotts.com` serves the v4 homepage over https.
- canonical metadata, open graph fields, sitemap urls, and repository links use
  the custom hostname and renamed repository.
- principal guide routes and the codex baseline resolve from production.
- github pages redirects its default url to the custom hostname.
- the release, repository metadata, readme, site, and issue closures tell the
  same story.
- legacy installation paths remain valid through 2026-11-05.

## rollback

if the custom domain does not verify, keep the pages deployment at its github
url and do not create or replace dns records. if the site build fails, leave the
repository rename intact, correct the workflow through a pull request, and keep
the previous successful pages artifact serving.
