# Contributing

Small, focused pull requests are welcome. Describe the problem, the resulting behavior, and how you checked it. Discuss substantial product or architecture changes in an issue first.

Follow the local setup in the README, use synthetic records, and run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Run the API suite for authentication, API, or database changes. Add regression tests for behavior or security fixes. Keep `package-lock.json` in sync with dependency changes.

Never commit credentials, `.env`/`.dev.vars` files, local database state, tax records, personal exports, or deployment archives. Review `git diff --cached` before committing. Do not put real personal data into issues, screenshots, or test fixtures.

Preserve per-user query scoping, same-origin mutation checks, private cache headers, escaped downloads, and opt-in recognition. Do not replace verified identity with a client-supplied ID, email, cookie, or header. New production integrations must keep the authentication boundary explicit and fail closed.

For schema changes, edit `db/schema.ts` and run `npm run db:generate`; commit the new migration and metadata together. Review generated SQL and test it on a disposable local database. Never edit an already-applied migration or run local test scripts against production.

Keep proposed perks visibly labeled. Do not imply tax verification, government affiliation, guaranteed benefits, or partner agreements that do not exist.

By submitting a contribution, you agree to license it under this project's MIT license. Preserve upstream notices when modifying vendored code. Be respectful and explain technical disagreements with concrete examples.
