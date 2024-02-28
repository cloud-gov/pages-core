#!/bin/bash

set -e

export GIT_COMMIT=`git rev-parse HEAD`
mkdir -p playwright-report/$APP_ENV/$GIT_COMMIT

npm exec playwright test
