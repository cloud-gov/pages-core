#!/bin/bash

set -e

curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_ACCESS_TOKEN" \
  -d '{"state": "'$GITHUB_STATE'", "context": "concourse", "target_url": "'$BUILD_URL'"}' \
  https://api.github.com/repos/18f/federalist/statuses/$(git rev-parse HEAD)