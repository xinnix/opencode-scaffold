#!/usr/bin/env bash

set -euo pipefail

echo "==> Type checking API"
pnpm -C apps/api exec tsc --noEmit

echo "==> Type checking Admin"
pnpm -C apps/admin exec tsc --noEmit

echo "==> Type checking Miniapp"
pnpm -C apps/miniapp type-check

echo "==> Type checking Shared"
pnpm -C infra/shared exec tsc --noEmit

echo "==> Type check completed"
