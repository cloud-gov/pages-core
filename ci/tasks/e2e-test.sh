#!/bin/bash

set -e

yarn install
yarn playwright install-deps
yarn playwright install

export GIT_COMMIT=`git rev-parse HEAD`
mkdir -p playwright-report/$APP_ENV/$GIT_COMMIT

yarn create-test-users
yarn playwright test
