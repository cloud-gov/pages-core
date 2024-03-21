#!/bin/bash

set -e

export GIT_COMMIT=`git rev-parse HEAD`
mkdir -p playwright-report/$APP_ENV/$GIT_COMMIT

npx playwright install-deps
npx playwright install
npx playwright test
