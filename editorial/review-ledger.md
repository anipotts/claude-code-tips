# editorial review ledger

This file tracks Ani's manual review of every currently public canonical page and each H1, H2, and H3 block. It is editorial working state, not public content. A section stays `unreviewed` until Ani has directly reviewed it. Git history, validation, publication status, and a lack of recent changes do not count as approval.

## states

- `unreviewed`: Ani has not reviewed the current wording.
- `in progress`: Ani has started reviewing or left specific direction, but the block is not approved.
- `Ani reviewed`: Ani has explicitly approved the current wording and fingerprint.
- `ready`: wording, evidence, media, attribution, and follow-up work are complete for publication.

## review order

1. handbook foundation
2. Codex
3. Claude Code
4. Grok
5. history
6. market
7. method
8. archive

## locked media policy

- Ani-owned assets may be stored locally and optimized for the site.
- Third-party media from X defaults to an official lazy embed or a link to the original post.
- Never rehost third-party media without permission or a compatible license.
- Show the creator's visible name, `@handle`, and original source link with a natural shoutout that does not imply affiliation.
- Every desired visual remains pending until its ownership, source, permission, and presentation are recorded in this ledger.

## 1. handbook foundation

### `/`

Source: `content/home.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: a casual guide to coding agents in production software (projects, startups & big tech) | unreviewed | Check title wording and scope with Ani. | Confirm the title makes no unsupported claim. | Decide during review. | Pending if media is added. | Ani reviews title. |
| H2: why i made this | unreviewed | Preserve the firsthand voice. Direct browser feedback exists for individual links, not approval of the whole block. | Recheck the linked X examples and product links. | No media currently requested. | Original links are present; verify labels and hover metadata. | Ani reviews the full section and its links. |

### `/handbook/operating-agents/`

Source: `content/handbook/operating-agents.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: techniques to operate agents | unreviewed | Check title and framing with Ani. | Audit page-level claims and sources. | Decide during review. | Pending if media is added. | Ani reviews title. |
| H2: start with a github repository | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: separate guidance from enforcement | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: use evidence to resolve uncertainty | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: isolate work by ownership | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: keep the main thread clean | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: preserve human control at the right boundary | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: verify completion | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: hand off durable state | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: review the whole system | unreviewed | Check wording and add or preserve Ani's experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |

## 2. Codex

### `/guides/codex/`

Source: `content/guides/codex.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: codex | unreviewed | Check page framing with Ani. | Audit page-level official sources and checked date. | Keep the page visually selective. | Pending for any added media. | Ani reviews title and page premise. |
| H2: this is codex | unreviewed | Direct browser feedback fixed placement and caption, but did not approve the prose. | Recheck current OpenAI surface claims. | Keep one Ani-owned screenshot directly below this heading. | Ani-owned; local asset and requested caption are present. | Ani reviews prose and confirms final crop/caption. |
| H3: one engineering loop, several control rooms | unreviewed | Preserve firsthand operating model. | Separate personal analysis from product facts. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the task can be its own workspace | unreviewed | Check whether this matches Ani's actual use. | Verify productless-task behavior if stated as fact. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: where codex lives | unreviewed | Check taxonomy and current product naming. | Refresh all current surface and feature claims. | Consider one official visual only if it clarifies the map. | Use official embed/link or licensed asset. | Ani reviews block after source refresh. |
| H3: terminal and editor keep the evidence close | unreviewed | Preserve Ani's preference and concrete examples. | Verify CLI and editor facts. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: desktop coordinates parallel work | unreviewed | Preserve firsthand desktop workflow. | Verify desktop feature claims. | Ani-owned workflow capture may help. | Ani-owned only unless an official source is used. | Ani reviews block and media need. |
| H3: cloud and mobile change where you steer | unreviewed | Check claims against Ani's actual remote workflow. | Refresh cloud and mobile documentation. | Prefer official lazy embed/link if needed. | Record creator/source if third party. | Ani reviews block. |
| H2: the interface is not the whole system | unreviewed | Check the interface/interaction-layer distinction. | Source product facts; label analysis clearly. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the interface changes what you can see | unreviewed | Add or preserve a concrete Ani example. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the interaction layer changes what codex can reach | unreviewed | Check this model against Ani's setup. | Verify instructions, tools, and access claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: controlling codex across devices | unreviewed | Check section framing with Ani. | Refresh remote-control facts. | Prefer official lazy embed/link if useful. | Record creator/source if third party. | Ani reviews block. |
| H3: steering is different from hosting | unreviewed | Preserve practical distinction and firsthand examples. | Verify Remote behavior. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: local, remote, and cloud execution are different | unreviewed | Check terminology against Ani's actual environments. | Refresh local, SSH, Remote, and cloud distinctions. | A simple owned diagram may help. | Ani-owned if created locally. | Ani reviews block. |
| H3: mobile keeps the control loop close | unreviewed | Preserve direct mobile-use observations. | Verify current mobile capabilities. | Official lazy embed/link or Ani-owned capture. | Record source and permission. | Ani reviews block. |
| H2: start with what you are trying to finish | unreviewed | Check the artifact-first framing. | Refresh ChatGPT Work boundary claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: code should end in the repository | unreviewed | Preserve this as Ani's recommendation. | Distinguish recommendation from product requirement. | No media currently needed. | Not applicable. | Ani reviews block. |
| H3: ChatGPT Work begins with a finished deliverable | unreviewed | Check naming, casing, and Ani's intended distinction. | Refresh official ChatGPT Work source. | Decide during review. | Pending if media is added. | Ani reviews block. |

### `/guides/codex/configuration/`

Source: `content/guides/codex/configuration.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: configuration | unreviewed | Check page framing with Ani. | Audit page-level official sources. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: configuration has separate jobs | unreviewed | Check taxonomy against Ani's practice. | Verify current configuration model. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: AGENTS.md explains the repository | unreviewed | Preserve real repository examples. | Verify precedence and scope claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: config.toml chooses defaults | unreviewed | Check examples against Ani's configuration. | Refresh official config reference. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: permissions are two different questions | unreviewed | Check the distinction in Ani's words. | Verify sandbox and approval behavior. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the sandbox defines reach | unreviewed | Add or preserve a concrete boundary example. | Verify current sandbox options. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: approval policy defines interruption | unreviewed | Add or preserve a concrete workflow example. | Verify current approval policies. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: keep identity and secrets outside the repository | unreviewed | Check recommendation and personal practice. | Support security claims with primary sources. | No media currently needed. | Not applicable. | Ani reviews block. |
| H3: credentials belong in external storage | unreviewed | Check tooling references against Ani's setup. | Verify credential-management claims. | Decide during review. | Pending if media is added. | Ani reviews block. |

### `/guides/codex/recommendations/`

Source: `content/guides/codex/recommendations.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: recommendations | unreviewed | Make Ani's opinion boundary explicit. | Audit page-level sources. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: my default codex setup | unreviewed | Preserve concrete personal defaults. | Source product facts inside the recommendation. | Ani-owned setup capture may help. | Ani-owned if captured locally. | Ani reviews block. |
| H2: when i switch surfaces | unreviewed | Check against Ani's actual switching behavior. | Verify surface capabilities. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the review surface follows the evidence | unreviewed | Preserve as a clear personal rule. | Separate analysis from factual claims. | No media currently needed. | Not applicable. | Ani reviews block. |
| H2: what i would avoid | unreviewed | Keep specific and experience based. | Source any product claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: parallelism that outruns review | unreviewed | Add or preserve a concrete failure mode. | Separate observation from general claim. | Decide during review. | Pending if media is added. | Ani reviews block. |

## 3. Claude Code

### `/guides/claude-code/`

Source: `content/guides/claude-code.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: claude code | unreviewed | Check page framing with Ani. | Audit page-level official sources and checked date. | Keep the page visually selective. | Pending for any added media. | Ani reviews title and premise. |
| H2: this is claude code | unreviewed | Check definition in Ani's voice. | Refresh current Anthropic product claims. | Consider one purposeful visual. | Official embed/link or licensed asset. | Ani reviews block. |
| H3: one engineering loop, several interfaces | unreviewed | Check comparison against Ani's use. | Separate analysis from official facts. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the repository gives the task its shape | unreviewed | Preserve concrete repository experience. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: where claude code lives | unreviewed | Check taxonomy and current naming. | Refresh surface and feature claims. | Consider one official visual only if clarifying. | Use official embed/link or licensed asset. | Ani reviews block after source refresh. |
| H3: terminal and IDE keep the evidence close | unreviewed | Preserve firsthand workflow. | Verify terminal and IDE facts. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: desktop coordinates parallel work | unreviewed | Check against Ani's actual desktop use. | Verify desktop capabilities. | Ani-owned capture may help. | Ani-owned only unless official source is used. | Ani reviews block. |
| H3: web, mobile, and Remote Control change where you steer | unreviewed | Check claims against Ani's real workflow. | Refresh web, mobile, and Remote Control docs. | Prefer official lazy embed/link if needed. | Record creator/source if third party. | Ani reviews block. |
| H2: the interface is not the whole system | unreviewed | Check interface/interaction-layer framing. | Source product facts; label analysis. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the interface changes what you can see | unreviewed | Add or preserve a concrete Ani example. | Audit claims and source coverage. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the interaction layer changes how claude code behaves | unreviewed | Check this model against Ani's setup. | Verify instruction, tool, and memory claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: controlling claude code across devices | unreviewed | Check section framing with Ani. | Refresh remote-control facts. | Prefer official lazy embed/link if useful. | Record creator/source if third party. | Ani reviews block. |
| H3: steering is different from hosting | unreviewed | Preserve practical distinction. | Verify current hosting behavior. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: web and Remote Control use different execution models | unreviewed | Check terminology against actual use. | Refresh execution-model sources. | A simple owned diagram may help. | Ani-owned if created locally. | Ani reviews block. |
| H3: mobile keeps the control loop close | unreviewed | Preserve direct mobile observations. | Verify current mobile capabilities. | Official lazy embed/link or Ani-owned capture. | Record source and permission. | Ani reviews block. |
| H2: start with what you are trying to finish | unreviewed | Check artifact-first framing. | Refresh Cowork boundary claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: code should end in the repository | unreviewed | Preserve as Ani's recommendation. | Distinguish recommendation from requirement. | No media currently needed. | Not applicable. | Ani reviews block. |
| H3: Cowork begins with a finished deliverable | unreviewed | Check naming and intended distinction. | Refresh official Cowork source. | Decide during review. | Pending if media is added. | Ani reviews block. |

### `/guides/claude-code/configuration/`

Source: `content/guides/claude-code/configuration.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: configuration | unreviewed | Check page framing with Ani. | Audit page-level official sources. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: configuration has separate jobs | unreviewed | Check taxonomy against Ani's practice. | Verify current configuration model. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: CLAUDE.md explains the repository | unreviewed | Preserve real repository examples. | Verify precedence and scope claims. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: settings choose behavior | unreviewed | Check examples against Ani's setup. | Refresh official settings reference. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: separate instructions from memory | unreviewed | Check distinction in Ani's words. | Verify current instruction and memory behavior. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: shared rules have one canonical source | unreviewed | Preserve concrete maintenance experience. | Audit claims and source coverage. | No media currently needed. | Not applicable. | Ani reviews block. |
| H2: inspect the effective configuration | unreviewed | Add or preserve a concrete debugging example. | Verify current inspection methods. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: imports and precedence can hide the source | unreviewed | Check actual failure modes Ani has seen. | Verify import and precedence rules. | Decide during review. | Pending if media is added. | Ani reviews block. |

### `/guides/claude-code/recommendations/`

Source: `content/guides/claude-code/recommendations.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: recommendations | unreviewed | Make Ani's opinion boundary explicit. | Audit page-level sources. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: my default claude code setup | unreviewed | Preserve concrete personal defaults. | Source product facts inside the recommendation. | Ani-owned setup capture may help. | Ani-owned if captured locally. | Ani reviews block. |
| H2: when i switch surfaces | unreviewed | Check against Ani's actual switching behavior. | Verify surface capabilities. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: the review surface follows the evidence | unreviewed | Preserve as a clear personal rule. | Separate analysis from factual claims. | No media currently needed. | Not applicable. | Ani reviews block. |
| H2: what i am still watching | unreviewed | Keep uncertainty concrete and current. | Refresh open product questions. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: current workflow features need a paired test | unreviewed | Check the proposed test against Ani's workflow. | Record test evidence and official sources. | Decide during review. | Pending if media is added. | Ani reviews block. |

## 4. Grok

### `/guides/grok/`

Source: `content/guides/grok.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: grok | unreviewed | Check page framing and firsthand scope with Ani. | Refresh all current product claims. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: this is grok | unreviewed | Add or preserve Ani's actual experience and uncertainty. | Require current primary sources for product facts. | Prefer official lazy embed/link if useful. | Record creator/source if third party. | Ani reviews block after source refresh. |

### `/guides/grok/configuration/`

Source: `content/guides/grok/configuration.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: configuration | unreviewed | Check page framing and limits with Ani. | Refresh all configuration claims. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: the current configuration map | unreviewed | Keep uncertainty and tested boundaries explicit. | Require primary sources plus hands-on evidence. | An Ani-owned capture may help after testing. | Ani-owned if captured locally. | Test, source, then Ani reviews block. |

### `/guides/grok/recommendations/`

Source: `content/guides/grok/recommendations.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: recommendations | unreviewed | Make the limited opinion boundary explicit. | Refresh page-level sources. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: begin with the product boundary | unreviewed | Check recommendation against Ani's actual use. | Require current primary sources and tested behavior. | Decide during review. | Pending if media is added. | Test, source, then Ani reviews block. |

## 5. history

### `/handbook/history/`

Source: `content/handbook/history.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: how coding agents got here | unreviewed | Check the story boundary and title with Ani. | Audit every dated event against primary sources. | Consider a selective timeline visual. | Use owned graphics; link original sources. | Ani reviews title and chronology. |
| H2: what i take from the timeline | unreviewed | Preserve Ani's interpretation and uncertainty. | Separate sourced history from personal analysis. | Decide during review. | Pending if media is added. | Ani reviews block after source audit. |

## 6. market

### `/handbook/choosing-a-setup/`

Source: `content/handbook/choosing-a-setup.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: choosing a coding agent setup | unreviewed | Check market framing and intended reader with Ani. | Refresh product and hardware claims. | Decide during review. | Pending if media is added. | Ani reviews title and premise. |
| H2: choose the layer first | unreviewed | Check decision model against Ani's experience. | Audit claims and source coverage. | A simple owned comparison may help. | Ani-owned if created locally. | Ani reviews block. |
| H2: common setups | unreviewed | Add or preserve concrete real-world examples. | Refresh current product options. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: hardware and local analysis | unreviewed | Check scope and practical relevance. | Refresh hardware facts and dates. | Prefer official product links over rehosted media. | Record source and permission. | Ani reviews block after source refresh. |
| H3: memory | unreviewed | Check recommendation and tradeoffs. | Source hardware requirements and measurements. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: storage | unreviewed | Check recommendation and tradeoffs. | Source storage requirements and measurements. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H3: attention | unreviewed | Preserve this as an explicit human constraint. | Separate analysis from factual claims. | No media currently needed. | Not applicable. | Ani reviews block. |
| H2: a practical default | unreviewed | Make Ani's recommendation concrete and bounded. | Source facts inside the recommendation. | Decide during review. | Pending if media is added. | Ani reviews block. |

## 7. method

### `/handbook/method-and-sources/`

Source: `content/handbook/method-and-sources.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: where this comes from | unreviewed | Check title and trust framing with Ani. | Confirm the page describes the real editorial process. | No media currently needed. | Not applicable. | Ani reviews title and premise. |
| H2: what i actually use | unreviewed | Preserve exact firsthand scope. | Ensure examples match current use. | Decide during review. | Pending if media is added. | Ani reviews block. |
| H2: how current claims get checked | unreviewed | Keep process concise and credible. | Verify it matches repository checks and source registry. | No media currently needed. | Not applicable. | Ani reviews block. |
| H2: how tested claims are recorded | unreviewed | Check whether the stated process is actually followed. | Compare against current evidence fields and receipts. | No media currently needed. | Not applicable. | Ani reviews block. |
| H2: what this does not settle | unreviewed | Preserve honest limits and uncertainty. | Confirm limitations are complete. | No media currently needed. | Not applicable. | Ani reviews block. |

## 8. archive

### `/archive/claude-code-tools/`

Source: `content/archive/claude-code-tools.md`

| Block | State | Wording and personal insight | Evidence or source needs | Desired media | Attribution or permission | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| H1: archived claude code tools | unreviewed | Review only for compatibility clarity; preserve frozen scope. | Verify security, data-loss, and installation-blocker facts only. | No new media planned. | Not applicable. | Ani reviews archive boundary. |
| H2: install paths that still work | unreviewed | Keep instructions minimal and compatibility focused. | Test only supported compatibility paths. | No new media planned. | Not applicable. | Verify compatibility, then Ani reviews. |
| H2: what happens next | unreviewed | Check sunset wording and dates with Ani. | Verify current compatibility-window date. | No new media planned. | Not applicable. | Ani reviews block. |
