# Import Comparison Platform

Next.js marketplace application that keeps the original local-product storefront while adding AliExpress supplier discovery, matching, landed-cost comparison, supplier catalog operations, and an import checkout boundary.

## V4/V5 integration contract

The storefront has two independent catalog paths:

- **Local catalog:** every valid `LocalSKU` remains eligible for `/products` even when it has no AliExpress candidate, match, comparison, image, or description.
- **Supplier catalog:** an AliExpress SKU is customer-visible only after it is published, has stock, and has a current persisted storefront price.
- **Matching:** enriches local products; it never determines whether a valid local product exists in the catalog.
- **Product detail:** local products remain usable as local-only listings when no valid comparison exists.
- **Import checkout:** remains behind the persisted supplier-price/stock/address validation boundary. Payment execution is intentionally paused.

This separation is covered by automated tests so later storefront work does not accidentally restore the old behavior where unmatched local products disappear.

## Local development

Install dependencies and run the normal checks:

```bash
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:production -- # requires SMOKE_BASE_URL
```

Create your local `.env` from `.env.example`. Keep secrets out of Git.

For the V5 admin surface, configure `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` locally. Supplier catalog machine endpoints additionally use `CATALOG_SYNC_SECRET`.

## Database

Prisma migrations are ordered under `prisma/migrations/`. A synced V5 checkout must run:

```bash
npx prisma migrate deploy
npx prisma generate
```

Do not assume an older local V4 checkout has the V5 migration history merely because its existing migrations are already applied to Neon.

## CI

The GitHub Actions CI workflow runs linting, Prisma client generation, TypeScript type checking, the automated Node test suite, and the production build on pull requests and the V5 hardening branch. GitHub Actions runs the workflow version associated with the triggering commit, so CI results should be checked against the exact branch/commit being changed.

## Deployment

The application can be deployed as a Next.js application. The repository deliberately does not assume a specific hosting vendor. The production application URL is supplied to GitHub Actions as `PRODUCTION_APP_URL`.

Before exposing the admin/catalog operations publicly, configure the required database, Redis, AliExpress, admin, and catalog-sync secrets. Daraja remains sandbox/paused until payment execution is explicitly reopened.

## Production operations

### 1. Database migration

The **Production Database Migration** GitHub Actions workflow remains manually dispatchable and also runs automatically on pushes to `main` that change Prisma migrations, the Prisma schema, or the migration workflow itself. It runs:

```bash
npm ci
npx prisma migrate deploy
npx prisma migrate status
```

This keeps production schema changes aligned with schema-changing commits without running migrations inside the Next.js build. Configure these GitHub Actions production secrets:

- `DATABASE_URL`
- `DIRECT_URL` when required by the Prisma datasource/provider

The migration job uses the protected `production` GitHub environment and serializes concurrent migration runs.

### 2. Application deployment

Deploy the exact commit that passed CI. Configure the application's runtime environment with:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CATALOG_SYNC_SECRET`
- Redis/AliExpress variables when supplier operations are enabled
- `NEXT_PUBLIC_APP_URL` as the public HTTPS origin
- analytics and Google verification variables as needed
- Daraja variables only when payment execution is being enabled

Keep `DARAJA_ENVIRONMENT=sandbox` until live M-PESA payment execution has been explicitly enabled and the production callback URL has been verified.

### 3. Scheduled supplier operations

The **Supplier Operations** workflow is provider-neutral and calls the protected production API:

- catalog discovery/hydration: daily at 02:17 UTC
- supplier repricing: every 6 hours at 47 minutes past the hour
- manual dispatch supports `all`, `sync`, or `reprice`

Configure these GitHub Actions production secrets:

- `PRODUCTION_APP_URL`
- `CATALOG_SYNC_SECRET`

Supplier synchronization only persists supplier data; it does not publish AliExpress SKUs automatically. Publishing remains an explicit admin operation.

### 4. Production smoke validation

After deployment and after every schema-changing release, run the manual **Production Smoke Validation** workflow. It checks:

- `/api/health`
- `/products`
- `/robots.txt`
- `/sitemap.xml`
- the protected supplier endpoint rejects requests without the catalog-sync secret

The smoke script is also available locally as:

```bash
SMOKE_BASE_URL=https://your-production-origin.example npm run smoke:production
```

Do not use a customer payment to perform a smoke test while Daraja is sandbox/paused. Payment validation should be a separate controlled M-PESA acceptance test after live credentials and callback routing are explicitly enabled.


### 5. AliExpress shipment tracking

Paid import orders are linked to their AliExpress supplier order IDs. KijijiCart polls the AliExpress dropshipper order API for logistics status, carrier/service, and tracking numbers, stores shipment snapshots/events, and exposes the customer tracking page at `/track-order` through a tokenized order link.

The existing GitHub Actions **Supplier Operations** workflow runs the protected `/api/admin/aliexpress/tracking-sync` endpoint every 6 hours using `CATALOG_SYNC_SECRET`. The customer can also manually refresh tracking from the tokenized tracking page.

## First-release sequence

1. Ensure the production database has a verified backup/PITR posture.
2. Merge the CI-green schema-changing commit; the production migration workflow runs automatically from `main`.
3. Deploy the exact application commit after the migration run succeeds.
4. Confirm `/api/health` is healthy.
5. Run production smoke validation.
6. Log in to `/admin` and verify catalog health, order recovery, and supplier readiness.
7. Confirm local products are visible independently of matching state.
8. If supplier operations are enabled, run one manual supplier sync and reprice, review the resulting admin catalog data, and only then leave the schedule enabled.
9. Keep supplier SKUs unpublished until title, image, stock, and current sell price are verified.
10. Keep Daraja sandbox/paused until a separate controlled live-payment acceptance test has passed.

Do not run Prisma migrations as part of the Next.js build command. The production build remains a deterministic application build, while database schema changes are applied by the protected migration workflow.

## Project structure

- `app/products` — customer catalog
- `app/product/[sku]` — local product detail/comparison
- `app/import/[productId]/[skuId]` — supplier import checkout
- `app/admin/import` — local CSV ingestion
- `app/admin/review` — match review
- `app/admin/catalog` — supplier catalog operations
- `app/admin/health` — catalog health
- `lib/matching` — matching and review decision rules
- `lib/pricing` — supplier landed-cost/repricing logic
- `lib/aliexpress` — AliExpress API, discovery, freight, address, and catalog sync
- `lib/storefront` — storefront eligibility and product composition
- `tests` — automated regression coverage
- `scripts/smoke-production.mjs` — non-destructive production smoke checks

## Learn more

- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
