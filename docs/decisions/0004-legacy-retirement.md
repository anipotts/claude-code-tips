# 0004: legacy retirement

status: accepted

date: 2026-08-07

## context

the default branch still contains three claude code plugins, standalone hooks,
examples, test suites, and historical media. those files preserve working install
paths, but they now dominate a repository whose active product is a field guide.
current first-party systems also cover more of the session, worktree, messaging,
memory, and permission surface that motivated the tools.

## decision

honor the published compatibility window through 2026-11-05. accept only verified
security fixes, realistic data-loss fixes, current compatibility breaks, and
installation blockers.

on 2026-11-05, create the signed tag `legacy-tools-final-2026-11-05`. after the tag
is verified on github, remove plugin code, standalone hooks, historical gifs, and
claude-only examples from the default branch. preserve repository history and the
tag as the immutable implementation record.

## reasons

- honoring the window preserves trust with existing users.
- removing the code afterward restores a clear default-branch identity.
- a signed tag is a more honest compatibility boundary than indefinite partial
  maintenance.
- no codex ports should be built without a new user problem and a fresh decision.

## alternatives considered

immediate removal would break the stated migration period. indefinite retention
would keep stale product assumptions and privacy-sensitive transcript tooling at
the center of the repository.

## consequences

compatibility tests remain required until the deadline. legacy pages stay clearly
labeled and remain outside the primary navigation. feature requests are resolved
against this policy rather than added to a backlog.

## verification

- marketplace paths remain unchanged through 2026-11-05.
- the final tag is signed and remotely visible before any removal commit.
- the default branch no longer contains legacy code after the retirement change.
