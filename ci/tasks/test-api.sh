#!/usr/bin/env bash
set -euo pipefail

cd app

yarn test:cover; status=$?

exit $status
