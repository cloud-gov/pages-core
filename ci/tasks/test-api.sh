#!/usr/bin/env bash
set -euo pipefail

cd app

echo "we're rewriting our frontend tests!"
./scripts/wait-for-it.sh db:5432 -- yarn test:prepare && yarn test:server:cover ; status=$?
exit $status
