#!/bin/bash

set -e

# build_url="https://ci.fr-stage.cloud.gov/teams/pages-staging/pipelines/pages-web-pipeline/jobs/$BUILD_JOB_NAME/builds/$BUILD_NAME"
build_url="https://ci.fr-stage.cloud.gov/teams/pages-staging/pipelines/pages-web-pipeline/jobs/test-and-deploy-admin-client-staging/builds"

echo "build name"
echo $BUILD_NAME

curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_ACCESS_TOKEN" \
  -d '{"state": "'"$GITHUB_STATE"'", "context": "concourse", "target_url": "'"$build_url"'"}' \
  "https://api.github.com/repos/18f/federalist/statuses/$(git rev-parse HEAD)"


  /teams/pages/pipelines/pages-web-pipeline/jobs/test-and-deploy-admin-client-staging/builds/19