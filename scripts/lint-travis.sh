#!/bin/bash

set -eu

if [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
  exit 0
fi;

DIFF_TARGET_BRANCH="$TRAVIS_BRANCH" ./scripts/lint-diff.sh
