# security

## reporting

report vulnerabilities through [github security advisories](https://github.com/anipotts/claude-code-tips/security/advisories/new) or email `hello@anipotts.com`.

please do not open a public issue for a vulnerability that could expose local files, credentials, transcripts, or command execution.

## scope

the active handbook contains documentation and validation automation. the legacy compatibility surface also includes:

- shell and python hooks under `hooks/` and `plugins/*/hooks/`.
- the `cc` mcp server.
- plugin commands and skills that can invoke local tools.
- github workflows that process repository content.

## legacy-tool risk

the legacy tools process local claude code state. session databases and transcripts may contain sensitive material and are not encrypted by these plugins. review retention settings, filesystem permissions, and backup behavior before installation.

legacy fixes are accepted through 2026-11-05 when they address a security issue, data-loss risk, or installation blocker.
