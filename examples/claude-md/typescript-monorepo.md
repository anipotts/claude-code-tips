# acme

typescript monorepo. pnpm workspaces. next.js frontend, express API, shared packages.

## structure

- `packages/web/` -- next.js 14 app router frontend
- `packages/api/` -- express REST API, serves /api/v1/*
- `packages/shared/` -- shared types, zod schemas, utils
- `packages/db/` -- drizzle ORM, migrations, seed scripts
- `packages/config/` -- shared tsconfig, eslint, tailwind configs
- `infra/` -- terraform, docker-compose, CI workflows
- `scripts/` -- dev tooling, codegen, db helpers

## commands

- `pnpm dev` -- starts web (3000) + api (4000) concurrently
- `pnpm test` -- vitest across all packages
- `pnpm -F web test` -- web tests only
- `pnpm -F api test` -- api tests only
- `pnpm -F db generate` -- generate drizzle migrations
- `pnpm -F db migrate` -- run pending migrations
- `pnpm -F db seed` -- seed dev database
- `pnpm typecheck` -- tsc --noEmit across all packages
- `pnpm lint` -- eslint across all packages
- `pnpm build` -- build all packages in dependency order

## conventions

- all files are .ts, never .js. no exceptions
- tests live next to source: `user.ts` -> `user.test.ts`
- imports between packages use workspace aliases: `@acme/shared`, `@acme/db`
- zod schemas are the source of truth for all validation -- never manual type guards
- API routes follow REST: `router.get('/users/:id')` not `router.get('/getUser')`
- error messages are lowercase, no trailing periods
- all API responses use the `ApiResponse<T>` wrapper from `@acme/shared/types`
- env vars loaded via `@acme/config/env` with zod validation, never raw `process.env`
- prefer `Map` and `Set` over plain objects when keys are dynamic
- no default exports except for next.js pages/layouts

## testing patterns

- unit tests use vitest + @testing-library/react for web
- API integration tests use supertest against a real test db
- always clean up test data -- use the `withTestDb()` helper from `@acme/db/test-utils`
- mock external services with msw, never jest.mock for http calls
- snapshot tests are banned -- they always go stale

## common mistakes

- dont import from `packages/shared/src/...` directly -- use `@acme/shared`
- dont add deps to root package.json unless its a dev tool used everywhere
- the web package uses next.js app router -- no `pages/` directory, no `getServerSideProps`
- drizzle migrations are sequential, not timestamped. dont rename migration files
- `pnpm install` at root, never inside a package directory

## package-specific notes

@packages/web/CLAUDE.md
@packages/api/CLAUDE.md
@packages/db/CLAUDE.md
