#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

CF_APP_GUID=`cf app $CF_APP_NAME --guid`

cf curl /v3/apps/$CF_APP_GUID/env | \
    jq -r 'to_entries | .[] | .value | to_entries | map({key, value: (.value | tostring) }) | .[] | join("=")' \
    > .env
