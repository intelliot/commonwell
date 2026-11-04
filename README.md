# Commonwell

An independent membership app that recognizes **self-reported tax contributions**. Track annual totals, explore contribution tiers, and download a personal membership card, certificate, or CSV statement.

Commonwell is a prototype, not a tax filing service, government program, or verified taxpayer credential. Proposed partner perks are ideas, not active benefits. There are no payments or live commercial partner agreements.

## Features

- A clearly labeled sample account, with no sign-in required.
- Private contribution history, charts, and five membership tiers.
- Add, edit, delete, search, and filter annual totals by category.
- CSV preview/import with duplicate rejection and atomic rollback; CSV export.
- Downloadable SVG membership cards and certificates with self-reported disclosures.
- Saved perk ideas, suggestions, and an optional recognition board.
- Responsive layouts, keyboard-accessible dialogs, and home-screen icons.
- Local fonts and illustrations; no third-party analytics or remote visual assets.

## Run locally

Use **Node.js 22.13 or newer** (Node 22 LTS recommended), npm, and a loopback development server. No cloud credentials or paid services are needed for local development.

```sh
git clone https://github.com/intelliot/commonwell.git
cd commonwell
npm ci
npm run build
npm run db:init
npm run dev -- --host 127.0.0.1
```

Open **http://127.0.0.1:5173**. The local sign-in link creates a synthetic development identity; use only invented records. Local database state stays in ignored `.wrangler/` files. `db:init` applies the initial schema to a **fresh** local database. Run it once; it is not a reset command or a production migration command.

Local sign-in is a development convenience, not an authentication provider. Keep the dev server on loopback and do not expose it through a public tunnel.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run test:lint
npm run build
npm audit
```

With the migrated development server running, also run:

```sh
npm run test:api
```

The API suite runs only against loopback URLs. Use a disposable local database: it creates synthetic records in years 1901–1903, checks downloads and CRUD, verifies duplicate rejection and import rollback, exercises opt-in recognition, and cleans up after success. It refuses to run if those years are already in use. `COMMONWELL_TEST_URL` can select a different local port.

GitHub Actions runs the unit/security tests, type checking, lint and lint regression checks, build, local API checks, and a full dependency audit that fails on any known vulnerability. Dependabot checks npm packages and Actions weekly.

## Privacy and authentication

Records are scoped to the authenticated user's ID. Recognition is off by default; opting in shares a display name, join date, and contribution tier with other signed-in members. The tier reveals a contribution range. Exact amounts and user IDs are excluded from that response.

The database stores a display name, recognition preference, annual year/category/amount totals, saved perk IDs, and suggestions. The app does not ask for tax returns, Social Security numbers, banking credentials, or payment details. Do not put that information in names, suggestions, imports, issue reports, or logs. Signed-in pages and private downloads use `Cache-Control: private, no-store`. Mutations require a matching Origin, and JSON bodies are limited to 50 KB while streaming.

This public repository contains source code and synthetic examples only. It has a fresh Git history and no existing Site ID, database contents, local sessions, deployment archives, or credentials.

## Hosting

The app uses React, Vinext/Vite, Cloudflare Workers, Drizzle, and D1. The original integration is designed for **Sites-managed authentication**. Publishing the repository does not deploy a service or grant access to an existing Site.

Production builds **strip incoming identity headers by default**. A plain Worker deployment therefore supports the anonymous sample experience but does not authenticate real users. Merely sending `oai-authenticated-user-*` headers cannot sign in.

For your own Sites deployment:

1. Create your own Site and D1 binding, and assign its Site ID to `.openai/hosting.json` in your deployment checkout. This repository deliberately supplies only the generic `DB` binding.
2. Apply the checked-in migrations to your new database through the hosting workflow.
3. Verify that the Sites authentication gateway is the only route to the Worker, rejects spoofed identity headers, and supplies authenticated identity itself.
4. Only then set the server-side Worker binding `COMMONWELL_TRUST_SITES_IDENTITY` to the exact string `true`. This is a trust switch, not a secret or a substitute for authentication. Never enable it on a Worker reachable directly by untrusted clients.
5. Verify anonymous rejection, cross-account isolation, same-origin writes, and private cache behavior in your deployment before collecting real records.

Other hosting platforms need their own verified authentication adapter. The local mock sign-in must never be used in production. Operators are responsible for access controls, HTTPS, rate limits, database backups, retention, and account/data deletion procedures. This prototype does not yet have self-service account deletion or application-level rate limiting.

## Source layout

- `components/membership-app.tsx`: member interface and workflows.
- `app/api/v1/[...path]/route.ts`: authenticated API and downloads.
- `worker/index.ts`, `lib/request-security.ts`: authentication boundary and request limits.
- `lib/domain.ts`: validation, tiers, CSV parsing, and product catalog.
- `lib/documents.ts`: escaped SVG card and certificate rendering.
- `db/schema.ts`, `drizzle/`: schema and migrations.
- `.openai/hosting.json`: generic Sites/Cloudflare binding configuration.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance and [SECURITY.md](SECURITY.md) for private vulnerability reporting.

MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The license does not imply endorsement by any government, OpenAI, Cloudflare, or a proposed benefit provider.
