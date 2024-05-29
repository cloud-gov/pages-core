#!/usr/bin/env bash
set -euo pipefail

cd app

./scripts/wait-for-it.sh db:5432 -- yarn test:cover; status=$?

exit $status
