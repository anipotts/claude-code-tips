# handoff: course platform on anipotts.com

copy this entire file and paste it as a prompt into a new claude code session in `~/Code/active/websites/anipotts.com`.

---

## context

you are adding a course platform to anipotts.com at `claude.anipotts.com`. the course is "claude code tips" by ani potts — a 4-tier paid course (free/core $49/pro $149/cohort $499) teaching claude code workflows.

the course content, plan, and structure live in a SEPARATE repo at `~/Code/active/claude-code-tips/`. specifically:
- `handoffs/course-structure.md` — lesson plan, 19 lessons across 4 tiers
- `handoffs/monetization-research.md` — pricing, platform comparison, launch plan
- `docs/` — the source material that becomes lessons

**you are NOT writing course content.** you are building the PLATFORM that hosts and gates it.

---

## what already exists on anipotts.com

### stack
- next.js 16.1.5 + react 19 + tailwind 4 + supabase
- turbo monorepo: `apps/www/`, packages: `@anipotts/ui`, `@anipotts/lib`, `@anipotts/types`, `@anipotts/config`, `@anipotts/styles`
- vercel hosting, posthog analytics, resend email, upstash rate limiting
- pnpm 10.5.2, node >=20

### existing claude page
- `apps/www/src/app/(main)/claude/page.tsx` — landing page with stats, plugins, hooks, docs
- `apps/www/src/app/(main)/claude/data.ts` — hardcoded plugin/hook/doc data (STALE — references old names like "miner" instead of "mine")
- `apps/www/src/app/(main)/claude/claude-stats.json` — session telemetry data

### admin panel
- `apps/www/src/app/admin/` — content pipeline admin
- auth: custom password + optional TOTP, NOT supabase auth. uses `ADMIN_PASSWORD` env var + session cookies
- actions: `createThought`, `updateContentStatus`, `approveContent`
- pipeline: idea → draft → ready → atomized → published

### supabase schema (3 migrations)
- `thoughts` table: content with status workflow, series_type, platforms_targeted/posted, FTS
- `atoms` table: platform-specific content variants (twitter, tiktok, etc.)
- `content_config` table: YAML configs as JSONB
- `content_schedule` table: editorial calendar
- `update_alerts` table: anthropic/claude updates tracker
- RPC: `search_content()`, `auto_publish_scheduled()`, `increment_thought_views()`

### auth pattern
- NO supabase auth module. custom cookie-based with `verifyAdminPassword()` + `verifyAdminTotp()`
- rate limited via upstash redis
- admin routes check `requireAuth()` server action

### ui components (@anipotts/ui)
- FadeIn, WavesBackground, TerminalBackground, TerminalHeader, ThemeToggle, ExpandableNav, StatusDot, PostHogProvider
- page scaffolding: PageFrame, PagePrelude, PageTitle, PageSummary, CardBlock, ContentBlocks (in apps/www/src/components/page/)

---

## what to build

### phase 1: subdomain middleware + course schema

1. **create `apps/www/src/middleware.ts`** — route `claude.anipotts.com` requests to `/course/*` routes internally
   ```typescript
   // if host is claude.anipotts.com, rewrite /foo to /course/foo
   // if host is anipotts.com, pass through normally
   ```

2. **add vercel domain** — add `claude.anipotts.com` as a domain alias in vercel project settings (manual step for ani)

3. **create supabase migration `004_course.sql`**:
   ```sql
   create table lessons (
     id uuid primary key default gen_random_uuid(),
     slug text unique not null,
     title text not null,
     body text not null,              -- MDX or rich text content
     summary text,                    -- one-line for cards
     tier text not null check (tier in ('free', 'core', 'pro', 'cohort')),
     lesson_order int not null,
     published boolean default false,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   create table subscriptions (
     id uuid primary key default gen_random_uuid(),
     email text not null,
     polar_customer_id text,
     polar_subscription_id text unique,
     tier text not null check (tier in ('free', 'core', 'pro', 'cohort')),
     status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'expired')),
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   -- indexes
   create index idx_lessons_tier on lessons(tier);
   create index idx_lessons_order on lessons(lesson_order);
   create index idx_subscriptions_email on subscriptions(email);
   create index idx_subscriptions_status on subscriptions(status);

   -- RLS: free lessons are public, paid need subscription check
   alter table lessons enable row level security;
   create policy "free lessons public" on lessons for select
     using (tier = 'free' and published = true);

   -- updated_at trigger
   create trigger lessons_updated_at before update on lessons
     for each row execute function update_updated_at_column();
   create trigger subscriptions_updated_at before update on subscriptions
     for each row execute function update_updated_at_column();
   ```

### phase 2: lesson admin editor

4. **add admin tab for lessons** at `apps/www/src/app/admin/lessons/`
   - list all lessons, grouped by tier, ordered by lesson_order
   - create/edit lesson form with: title, slug, tier (dropdown), order, body (rich text editor), published toggle
   - use tiptap or novel for the rich text editor (install `@tiptap/react @tiptap/starter-kit @tiptap/extension-code-block-lowlight`)
   - code blocks MUST have syntax highlighting (this is a dev course)
   - save to supabase `lessons` table via server actions

5. **add admin nav item** — update `apps/www/src/app/admin/admin-nav.tsx` to include "lessons" tab

### phase 3: course pages

6. **create course routes** at `apps/www/src/app/course/`
   - `page.tsx` — landing page (tier comparison, pricing, CTA buttons)
   - `lessons/page.tsx` — lesson index (all tiers, gated ones show lock icon)
   - `lessons/[slug]/page.tsx` — individual lesson page
   - use existing PageFrame, CardBlock, FadeIn components
   - free lessons render immediately
   - paid lessons check subscription cookie/session → show paywall if not subscribed

7. **subscription checking** — create a utility that checks if current visitor has access to a tier:
   - check a `COURSE_SESSION` cookie containing encrypted email + tier
   - look up subscription in supabase
   - for now, a simple cookie-based system (polar webhook sets it)

### phase 4: polar.sh integration

8. **create API route** at `apps/www/src/app/api/webhooks/polar/route.ts`
   - receives polar webhook events (subscription.created, subscription.updated, subscription.canceled)
   - upserts into supabase `subscriptions` table
   - sets `COURSE_SESSION` cookie on successful purchase

9. **create checkout links** — each tier card on the landing page links to polar.sh checkout URL with redirect back to course

### phase 5: update existing claude page

10. **fix stale data** in `apps/www/src/app/(main)/claude/data.ts`:
    - rename "miner" → "mine" in plugins array
    - update hook names to match current repo (safety-guard, panopticon, context-save, notify, replay-capture)
    - add course CTA section linking to `claude.anipotts.com`

---

## important constraints

- use the EXISTING admin auth pattern (password + cookie). do NOT add supabase auth
- use the EXISTING UI components from @anipotts/ui. do NOT install a component library
- use the EXISTING page scaffolding (PageFrame, CardBlock, etc.)
- follow the repo's tailwind 4 setup (no tailwind.config.js — uses CSS-based config)
- lowercase voice in all copy, no fluff, no em dashes
- NO squash merges — always regular merge commits
- commit granularly — one logical change per commit

## verification

after each phase, verify:
1. `pnpm build` passes
2. `pnpm lint` passes
3. admin panel still works at /admin
4. existing /claude page still renders
5. new /course routes render (even if empty initially)

---

## manual steps for ani (after platform is built)

1. add `claude.anipotts.com` as domain in vercel project settings
2. create polar.sh account, add products for each tier
3. set `POLAR_WEBHOOK_SECRET` env var in vercel
4. run migration 004_course.sql in supabase SQL editor
5. add first lesson via /admin/lessons
