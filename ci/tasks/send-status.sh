#!/bin/bash

set -e

build_url=$ATC_EXTERNAL_URL/teams/$BUILD_TEAM_NAME/pipelines/$BUILD_PIPELINE_NAME/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME

curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_ACCESS_TOKEN" \
  -d '{"state": "'"$GITHUB_STATE"'", "context": "concourse", "target_url": "'"$build_url"'"}' \
  "https://api.github.com/repos/18f/federalist/statuses/$(git rev-parse HEAD)"