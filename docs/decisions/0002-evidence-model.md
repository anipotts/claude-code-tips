# 0002: evidence model

status: accepted

date: 2026-08-07

## context

coding-agent products change faster than ordinary reference documentation.
feature lists, package versions, pricing, and permission behavior can drift on
different schedules. a polished comparison becomes misleading when readers
cannot distinguish reproduced behavior from documentation review or judgment.

## decision

every guide declares its products, verification date, status, evidence kinds,
sources, and evidence-rail entries in validated frontmatter. material product
claims link to primary sources near the claim.

the accepted evidence kinds are:

| kind | meaning |
|---|---|
| `hands-on` | reproduced by the author in a named environment |
| `source-verified` | confirmed in current primary documentation or source |
| `inference` | a reasoned judgment derived from observed evidence |
| `unknown` | current evidence is missing or insufficient |

field runs use a versioned JSON schema. they publish sanitized environment data,
scenario outcomes, artifacts, limitations, and redactions. they never publish raw
transcripts, credentials, private paths, or unsupported cost estimates.

## reasons

- evidence labels keep recommendations proportional to what was actually tested.
- nearby citations let a reader inspect claims without trusting the author first.
- structured runs make later comparisons possible without flattening every tool
  into a benchmark leaderboard.
- explicit unknowns age better than confident prose built on missing evidence.

## alternatives considered

page-level source lists were too coarse for material capability claims. generated
summaries could create a larger surface without adding judgment. vendor benchmark
tables measured model outputs while missing supervision, recovery, and review cost.

## consequences

source and run validation become required checks. a source update can invalidate a
recommendation without automatically rewriting it. publication remains a human
decision after the relevant evidence is reviewed.

## verification

- every active guide passes the content schema.
- every referenced source identifier exists in the registry.
- every public run passes the field-run schema and redaction checks.
- current claude code guidance remains `source-verified` until its protocol rerun.
