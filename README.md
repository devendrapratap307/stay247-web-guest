# StayServe Guest (web)

React 19 + TypeScript + Vite single-page app for guests who scan a QR code. It is a **static bundle**: deploy it to **S3 (+ CloudFront)**. There is no Dockerfile and no nginx. This folder is fully independent: it shares no code or workspace with the other StayServe projects, so it can live in its own repo and deploy to its own bucket.

## Run locally
```bash
npm install
npm start            # http://localhost:5174, talks to the API at VITE_API_URL in .env.local (default http://localhost:8080)
npm test             # vitest
npm run typecheck
```

## Environments
| Env | Command | Env file |
|---|---|---|
| local | `npm start` | `.env.local` |
| dev | `npm run build:dev` | `.env.dev` |
| prod | `npm run build:prod` | `.env.prod` |

Variables (all public, they end up in the bundle, so **never put secrets here**): `VITE_API_URL`, `VITE_APP_ENV` (local\|dev\|prod), `VITE_APP_AUDIENCE` (fixed to `guest`), `VITE_APP_NAME`. They are validated with zod at start-up (`src/config/env.ts`). Edit `.env.dev` / `.env.prod` with your real API URLs. The API must list this app's origin in its `CORS_ORIGINS`.

## Deploy to S3
```bash
export S3_BUCKET_PROD=my-bucket CLOUDFRONT_ID_PROD=E123ABC   # CLOUDFRONT_ID is optional
npm run deploy:prod      # typecheck + tests + build + s3 sync + invalidate index.html
```
`scripts/deploy.sh` uploads hashed assets with `max-age=31536000,immutable` and `index.html` with `no-cache`. CI does the same: `.github/workflows/deploy.yml` (GitHub OIDC, set repo variables `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_ID`; protect the `prod` environment with a required reviewer).

### One-time AWS setup
1. Private S3 bucket (Block Public Access ON), static website hosting not required.
2. CloudFront distribution with the bucket as origin via **Origin Access Control**; default root object `index.html`.
3. **SPA routing without nginx:** CloudFront → Error pages: map **403 and 404 → /index.html, response code 200** (TTL 0 for index).
4. Attach a **Response headers policy** with: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `Referrer-Policy`. S3 cannot set headers, and `frame-ancestors` is ignored in a meta tag, so set it here. A baseline CSP is also embedded in `index.html` and the API origin is injected from `VITE_API_URL` at build time.
5. Custom domain + ACM certificate (us-east-1) on the distribution.

## Structure
```
src/
  app/        App, main, router (lazy routes), providers, query-client (global error toasts)
  config/     env.ts (zod), routes.ts, constants.ts
  layouts/    AppLayout, AuthLayout, PublicLayout, components/{Sidebar,Header,Breadcrumb,MobileNavigation}
  components/ ui/ (Button, Input, Select, Dialog, DataTable, Pagination, Loader, EmptyState, Badge)
              form/ (FormInput, FormSelect, FormDatePicker, useZodForm + applyServerErrors)
              feedback/ (Toast, ConfirmDialog, ErrorMessage)
  modules/<name>/{api,components,hooks,pages,schemas,types,index.ts}
  services/   api-client (envelope, refresh single-flight, idempotency), api-error, upload
  stores/     auth (token in memory), tenant (X-Business-Id), ui (toasts + confirm)
```

## Alerts, validation, reusable pieces
- **Success / failure toasts:** `toast.success|error|info|warning(msg)`. Failed mutations toast automatically (`query-client.ts`); pass `meta: { silent: true }` when a form shows the error itself.
- **Confirmation:** `if (await confirmAction({ title, message, danger: true })) …`, used for cancel, remove and sign-out.
- **Validation:** zod schemas per module (`modules/*/schemas`) built from shared rules in `utils/validation.utils.ts`; `useZodForm` wires react-hook-form; backend 422 `fields` are mapped back to inputs with `applyServerErrors`.
- **Lists:** `DataTable` renders a table on large screens and numbered cards on small ones; the ✕ remove button (top-right of a card) appears only for line-item lists (`onRemove`).

## Security notes
Access token lives in memory only; refresh token is rotated and kept in sessionStorage; CSP in `index.html`; no secrets in env; amounts are always computed by the server.
# stay247-web-guest
