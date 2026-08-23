# coding agent tips

this is my evidence backed guide to working with coding agents, whether you are a student having an existential crisis, a startup founder working with real money for yourself and other people, or an engineer at one of the biggest technology companies in the world. the guidance is organized around the scale and consequences of the work.

[read the handbook](https://agents.anipotts.com) or go directly to a principal guide:

<!-- generated:guides:start -->
- [codex](https://agents.anipotts.com/guides/codex/)
- [claude code](https://agents.anipotts.com/guides/claude-code/)
- [grok](https://agents.anipotts.com/guides/grok/)
- [working with coding agents](https://agents.anipotts.com/guides/operating-system/)
- [how coding agents got here](https://agents.anipotts.com/history/)
- [choosing a coding agent setup](https://agents.anipotts.com/market/)
- [where this comes from](https://agents.anipotts.com/method/)
<!-- generated:guides:end -->

## what this helps you decide

the handbook separates the surface where you steer work, the harness that runs the agent loop, the model that supplies inference, and the orchestration used for parallel work. it also covers repository instructions, permissions, review, evidence, hardware, and the operating costs that appear after the first demo.

## evidence principle

<!-- generated:evidence:start -->
- `tested`: reproduced by the author in a named environment and version
- `official source`: confirmed in current primary documentation or source code
- `analysis`: a judgment derived from stated evidence
- `open question`: current evidence is missing or incomplete
<!-- generated:evidence:end -->

citations sit beside the claims they support. field runs publish inspectable artifacts and keep their limits visible.

## local verification

```bash
bun install --frozen-lockfile
bun run check:readme
bun run check
bun run build
bun run test:site
bun run test:a11y
```

built and maintained by [ani potts](https://anipotts.com). corrections with primary sources or reproducible field evidence are welcome.

MIT
