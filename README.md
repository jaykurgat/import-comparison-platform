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

The GitHub Actions CI workflow runs linting, Prisma client generation, TypeScript type checking, and the automated Node test suite on pull requests and the V5 hardening branch. GitHub Actions runs the workflow version associated with the triggering commit, so CI results should be checked against the exact branch/commit being changed.

## Deployment

The application can be deployed as a Next.js application. Before exposing the admin/catalog operations publicly, configure the required database, Redis, AliExpress, admin, and catalog-sync secrets. Daraja remains sandbox/paused until payment execution is explicitly reopened.

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

## Learn more

- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
