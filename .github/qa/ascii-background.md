# homepage ASCII field review

## scope and source

The implementation lives on `codex/ascii-provider-field`, in the isolated worktree `/private/tmp/coding-agent-tips-ascii`. It starts at `origin/main` commit `259e1d769c1c3005f2cb05c7ea869cc4c4497182`. The retained head of PR #312, `d967e4e988c57c7fffe6d1f0ef6c5dde74726cc6`, is already an ancestor. Its remote branch was deleted after merge. No rejected animation or exception stub exists in this base.

The first implementation commit is `da46325`. Followup refinements start on a resolved frame, handle font loading failure, preserve the immediate no-script reading path, and refine the contrast test's scope. The verified provider assets and original homepage wording remain the source of identity and prose.

## local verification

Passed:

- `bun run check`, with zero errors, warnings, or hints;
- `bun run build`;
- `bun run test:site`, including typography ownership and 15 canonical routes;
- `bun run check:performance`, including media, shared CSS, scripts, and fonts;
- `bun run check:content`;
- `bun run check:ui`.

The normal Astro development server was attempted, but the sandbox denied its loopback bind. A Vite static preview of this worktree's production build was available at `http://127.0.0.1:4341/`. Ordinary Chrome UI review covered the homepage at 1440 by 900 and 375 by 812 in both themes, at the top of the page, plus pause and resume. The field visibly moved and formed the source silhouettes. The first review prompted larger, denser glyphs. A startup event race and a deferred-frame cancellation were fixed during review.

`bun run test:a11y` and `bun run test:ascii` were attempted. Their preview ports were denied by the sandbox. Chromium launch was independently blocked by macOS Mach port restrictions. Lighthouse startup also failed. There are no valid Lighthouse, FCP, LCP, CLS, sustained CPU, or complete motion-matrix results from this session. Raw browser DevTools access was declined and was not retried through another route.

## contrast and byte measurements

Reading elements sit on fully opaque canvas or existing component surfaces above the animation. The ten pixel canvas colored extension around prose protects glyph edges. The underlying animated pixels therefore contribute zero to the protected text's background color.

The following are calculations from the paired semantic tokens, independent of animation phase. They are not a substitute for the pending rendered viewport matrix.

| foreground against canvas | light contrast | dark contrast |
| --- | --- | --- |
| primary text | 18.88:1 | 18.24:1 |
| muted text | 7.31:1 | 8.67:1 |
| accent text | 6.84:1 | 5.01:1 |

The initial audited production builds measured 9,697 bytes of gzipped homepage HTML before and 11,191 bytes after. The new controller and worker were approximately 2,301 and 1,264 bytes gzipped. Subsequent error handling and no-script refinements change these totals slightly. These are delivery size measurements only; browser performance remains unmeasured.

## remaining release work

The new `test:ascii` script covers 36 width, theme, and motion combinations, protected text backgrounds and contrast, full-page axe checks at mobile and desktop sizes, pixel stability under reduced motion and pause, live preference changes, route cleanup, no-script content, and worker transfer fallback.

The `ascii-homepage` CI job runs that matrix and a paired cold mobile Lighthouse comparison with three runs per revision. `audit:ascii` also samples ten seconds of worker frame cost and main thread task duration. Reports and screenshots go to the runner's temporary directory and the `ascii-homepage-qa` artifact. These checks have been authored and syntax checked; they still need execution in a permitted environment.

Before approval, run the new matrix and all existing browser checks, inspect reduced motion in both themes on desktop and mobile, inspect the complete provider sequence, and put actual before and after Lighthouse medians in the PR description. Keep the PR unmerged for Ani's visual review.

The session could push the first signed commit. PR creation was blocked because the connector required native approval while the session's approval policy was `never`. No PR, merge, deployment, or live publication was completed.
