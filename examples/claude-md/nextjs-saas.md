# launchpad

next.js 14 SaaS boilerplate. app router, prisma, stripe billing, tailwind. multi-tenant with org-based access control.

## structure

- `app/` -- next.js app router pages and layouts
- `app/(marketing)/` -- public pages: landing, pricing, blog
- `app/(dashboard)/` -- authed pages: dashboard, settings, billing
- `app/api/` -- route handlers: webhooks, internal API endpoints
- `components/` -- react components, organized by feature
- `components/ui/` -- shadcn/ui primitives, dont edit these manually
- `lib/` -- shared utilities, server-side helpers
- `lib/db.ts` -- prisma client singleton
- `lib/auth.ts` -- next-auth config and session helpers
- `lib/stripe.ts` -- stripe client and billing helpers
- `lib/email.ts` -- resend email client and templates
- `prisma/` -- schema, migrations, seed script
- `public/` -- static assets
- `e2e/` -- playwright tests

## commands

- `pnpm dev` -- start dev server on :3000
- `pnpm build` -- production build
- `pnpm test` -- vitest unit tests
- `pnpm test:e2e` -- playwright end-to-end tests
- `pnpm db:push` -- push schema changes to dev db (no migration)
- `pnpm db:migrate` -- create and run migration for production
- `pnpm db:seed` -- seed dev data (creates test org + users)
- `pnpm db:studio` -- open prisma studio on :5555
- `pnpm lint` -- next lint + prettier check
- `pnpm stripe:listen` -- forward stripe webhooks to localhost

## environment variables

- `.env.local` for dev, never committed. copy from `.env.example`
- required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- optional: `RESEND_API_KEY` (emails fall back to console.log in dev)
- `NEXT_PUBLIC_*` vars are client-safe. everything else is server-only
- stripe webhook secret is different for local (`whsec_...`) vs production

## conventions

- server components by default. add `"use client"` only when you need interactivity
- data fetching in server components, never in client components
- all db queries go through `lib/db.ts`, never import `@prisma/client` directly
- use `auth()` from `lib/auth.ts` to get the session in server components
- form actions use server actions in `app/(dashboard)/*/actions.ts`
- all prices are in cents. display formatting uses `lib/stripe.ts#formatPrice()`
- tailwind only, no CSS modules, no styled-components
- shadcn components live in `components/ui/` -- add new ones with `pnpm dlx shadcn@latest add`
- error boundaries per route segment in `error.tsx` files
- loading states in `loading.tsx` files, use skeleton components

## auth and multi-tenancy

- next-auth v5 with database sessions (not JWT)
- users belong to orgs. all dashboard queries filter by `orgId`
- middleware in `middleware.ts` handles auth redirects and org context
- role-based access: `owner`, `admin`, `member`. check with `requireRole()` from `lib/auth.ts`
- org switching stored in cookie, not URL

## common mistakes

- dont use `useEffect` for data fetching -- use server components or server actions
- dont import server-only code in client components -- next.js will bundle it to the client
- stripe webhooks must verify signatures. always use `stripe.webhooks.constructEvent()`
- prisma schema changes need `pnpm db:push` in dev, `pnpm db:migrate` for prod
- dont put API keys in `NEXT_PUBLIC_*` -- those are exposed to the browser
- the stripe price IDs are different between test and live mode. use env vars
- `revalidatePath()` after mutations, not `router.refresh()`

## deployment

- vercel for hosting. `main` branch auto-deploys to production
- planetscale for db. connection string in vercel env vars
- stripe webhooks point to `https://app.launchpad.dev/api/webhooks/stripe`
- preview deployments get their own db branch via planetscale

@docs/billing-flows.md
@docs/auth-patterns.md
@prisma/CLAUDE.md
