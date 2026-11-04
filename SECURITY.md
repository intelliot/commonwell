# Security

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/intelliot/commonwell/security/advisories/new). Do not publish exploit details, credentials, tax data, or other personal records in an issue. Include the affected commit, reproduction steps using synthetic data, impact, and a suggested fix if available. This project has no guaranteed response time or security support SLA.

Security fixes target the current default branch. There are no supported historical release branches yet.

## Trust boundary

The Worker rejects `oai-authenticated-user-*` identity headers in production unless the operator explicitly sets `COMMONWELL_TRUST_SITES_IDENTITY=true`. Enable that setting only behind the Sites authentication gateway, with direct Worker access blocked. The gateway must strip untrusted identity headers and supply verified identity. Neither a header nor the trust switch is proof of authentication by itself.

Local mock authentication accepts one synthetic identity on loopback. It is unsuitable for shared servers, public tunnels, or production. API integration checks must use a disposable local database.

## Data handling

Account queries and mutations are scoped to the authenticated user's ID. Mutations require a matching Origin. JSON requests have a streaming 50 KB limit. Account responses, signed-in HTML, and private downloads are not cacheable. SVG downloads escape display names and use a restrictive content policy.

Recognition is off by default. It exposes display name, join date, and tier when enabled; tier implies a contribution range. Data is self-reported and is not independently verified. Avoid sensitive free-text entries.

The repository excludes environment files, private keys, local database state, personal CSV exports, and deployment archives. If a credential is accidentally committed, revoke or rotate it immediately; deleting the file or rewriting history alone does not invalidate it.

## Deployment limits

This is a prototype, not a security-certified service. Production operators must configure verified identity, HTTPS, database access, abuse controls/rate limits, backups, retention, and deletion procedures. Self-service account deletion and application-level rate limiting are not implemented. Source publication does not validate any particular deployment.

Keep dependencies updated, review Dependabot alerts, and run `npm audit`. A passing scan only covers currently known patterns/advisories; it cannot prove the absence of vulnerabilities.

## Known dependency advisory (2026-11-03)

After updating the runtime, framework, and build dependencies, the remaining known advisory is [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), a moderate denial-of-service risk in `minimatch <11.0.1`, reached through ESLint and its plugins. It concerns processing hostile glob patterns in development tooling; these packages are not part of the application runtime. Lint only trusted checkout/configuration inputs. The current Next.js lint preset still depends on older minimatch APIs; forcing all consumers to v11 would break compatibility. Track upstream fixes through Dependabot. CI rejects high and critical advisories, while `npm audit` reports all severities.

The `esbuild` and `fflate` overrides select patched versions for older transitive consumers. Schema generation and builds are checked with these overrides. Reevaluate the overrides when upgrading Drizzle or Vinext.
