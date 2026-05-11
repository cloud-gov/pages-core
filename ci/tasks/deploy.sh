#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

# Get app guid and clear buildpack cache if app exists
if app_guid=$(cf app $CF_APP_NAME --guid 2>/dev/null); then
  echo "Clearing $CF_APP_NAME buildpack cache"

  cf curl -X POST /v3/apps/$app_guid/actions/clear_buildpack_cache
else
  echo "App $CF_APP_NAME not found, skipping buildpack cache clear"
fi

cf push $CF_APP_NAME \
  --strategy rolling \
  --path $CF_PATH \
  --manifest $CF_MANIFEST \
  --vars-file $CF_VARS_FILE \
  --stack $CF_STACK