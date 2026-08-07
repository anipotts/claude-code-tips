# field lab

the field lab evaluates coding-agent systems through repeatable engineering work.
it measures what the operator must understand, supervise, recover, and verify.
it does not produce a single winner score.

## protocol

each primary harness is evaluated against the same repository state and task
specification. a run should exercise:

1. architecture inspection with file-level evidence.
2. planning before a multi-file change.
3. implementation with repository-native verification.
4. interruption, denial, failure, and recovery.
5. session continuity and durable-state recovery.
6. delegated analysis with a bounded result.
7. isolated work in a separate worktree.
8. final diff review and completion evidence.

the task specification defines pass conditions before the agent begins. a run
records failed scenarios and operator interventions rather than editing them out.

## launch baseline

the first baseline records codex implementing the v4 publication from commit
`60aa685`. the public task specification is this repository's accepted launch plan.
the run record is added only after its artifacts and measurements exist.

the equivalent current claude code run is pending. current claude code guidance
remains source-verified until that run is performed from the same base commit and
task specification.

## published data

run records conform to [run.schema.json](./run.schema.json). public artifacts may
include commits, pull requests, test logs, screenshots, and concise design-review
notes.

the following never belongs in a public run:

- raw chat or agent transcripts.
- credentials, environment values, or account identifiers.
- private repository names or private absolute paths.
- personal data unrelated to the engineering result.
- inferred token cost when the product did not expose it.
- a success claim without evidence from the layer it describes.

## interpretation

elapsed time is useful only with operator interventions and review time beside it.
tool-call count can describe a run, but it does not establish quality. resource
measurements must identify what ran locally and what remained provider-hosted.

comparative conclusions require comparable runs. a missing run remains visible as
`pending`; it is not filled from documentation or remembered product behavior.
