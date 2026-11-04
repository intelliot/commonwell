# Contributing

Small, focused pull requests are welcome. Describe the problem, the resulting behavior, and how you checked it. Discuss substantial product or architecture changes in an issue first.

Follow the local setup in the README, use synthetic records, and run `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:lint`, and `npm run build`. Run the API suite for authentication, API, or database changes. Add regression tests for behavior or security fixes. Keep `package-lock.json` in sync with dependency changes.

Never commit credentials, `.env`/`.dev.vars` files, local database state, tax records, personal exports, or deployment archives. Review `git diff --cached` before committing. Do not put real personal data into issues, screenshots, or test fixtures.

Preserve per-user query scoping, same-origin mutation checks, private cache headers, escaped downloads, and opt-in recognition. Do not replace verified identity with a client-supplied ID, email, cookie, or header. New production integrations must keep the authentication boundary explicit and fail closed.

For schema changes, edit `db/schema.ts` and run `npm run db:generate`; commit the new migration and metadata together. Review generated SQL and test it on a disposable local database. Never edit an already-applied migration or run local test scripts against production.

Keep proposed perks visibly labeled. Do not imply tax verification, government affiliation, guaranteed benefits, or partner agreements that do not exist.

By submitting a contribution, you agree to license it under this project's MIT license. Preserve upstream notices when modifying vendored code. Be respectful and explain technical disagreements with concrete examples.

## Lint and dependency updates

`npm run lint` uses the native Oxlint rules in `.oxlintrc.json` for TypeScript, React, Hooks/Compiler, Next.js, imports, and accessibility. This replaces the old ESLint preset and removes its vulnerable minimatch dependency chain. `npm run test:lint` runs intentionally invalid and valid TSX through the real linter to guard hook ordering, render purity, list keys, accessibility, explicit `any`, and synchronous scripts. Keep those checks when changing the lint configuration. Vendored shadcn components retain their existing unused-variable and render-purity exceptions.

The migration is not an exact rule-for-rule replacement. Legacy `react/no-deprecated` and Next.js `no-location-assign-relative-destination` do not have native equivalents enabled here; review deprecated APIs and page navigation during code review. JSX usage is handled by the native unused-variable analysis, and Oxlint's React Compiler configuration is fixed rather than user configurable. The sign-out link deliberately uses a full-page gateway navigation and has a narrowly scoped lint exception.

Application dependencies target current stable releases. `@types/node` stays on the latest Node 22 version to match `.nvmrc` and the supported runtime rather than exposing APIs from a newer runtime. CI action updates must keep their immutable SHA pins and version comments in sync. Run a clean `npm ci`, the normal checks, and `npm audit --audit-level=low` after lockfile changes; do not use `--force` or `--legacy-peer-deps` to bypass compatibility problems.
