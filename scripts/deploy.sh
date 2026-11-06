#!/usr/bin/env bash
# Deploy the static build to S3 (+ CloudFront). Usage: scripts/deploy.sh <dev|prod>
# Requires: AWS credentials in env, S3_BUCKET_<ENV> and (optional) CLOUDFRONT_ID_<ENV> exported.
set -euo pipefail
ENV_NAME="${1:?usage: deploy.sh <dev|prod>}"
case "$ENV_NAME" in dev|prod) ;; *) echo "env must be dev or prod" >&2; exit 1;; esac
BUCKET_VAR="S3_BUCKET_$(echo "$ENV_NAME" | tr a-z A-Z)"
CF_VAR="CLOUDFRONT_ID_$(echo "$ENV_NAME" | tr a-z A-Z)"
BUCKET="${!BUCKET_VAR:?$BUCKET_VAR is not set}"

npm ci
npm run typecheck
npm test --if-present
npx vite build --mode "$ENV_NAME"

# Hashed assets: cache for a year. index.html: never cache, so a release is picked up immediately.
aws s3 sync dist "s3://$BUCKET" --delete --exclude index.html --cache-control "public,max-age=31536000,immutable"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" --cache-control "no-cache,no-store,must-revalidate" --content-type "text/html; charset=utf-8"

if [ -n "${!CF_VAR:-}" ]; then
  aws cloudfront create-invalidation --distribution-id "${!CF_VAR}" --paths "/index.html" >/dev/null
  echo "CloudFront invalidated"
fi
echo "Deployed $ENV_NAME -> s3://$BUCKET"
