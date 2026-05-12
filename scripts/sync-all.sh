#!/usr/bin/env bash

set -euo pipefail

echo "==> Generating Prisma client"
pnpm -C infra/database prisma generate

echo "==> Building shared package"
pnpm -C infra/shared build

echo "==> Sync completed"
