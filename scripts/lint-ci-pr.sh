#!/bin/bash

if [ -z "$CI_PULL_REQUEST" ]; then
  echo "Not in a pull request. Exiting."
  exit 0
fi;

# This is after the check for CI_PULL_REQUEST because
# that value is only set when the build is part of a build
# request in CircleCI
set -eu

DIFF_TARGET_BRANCH="$CIRCLE_BRANCH" ./scripts/lint-diff.sh
