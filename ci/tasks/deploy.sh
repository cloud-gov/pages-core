#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

cf push $CF_APP_NAME \
  --strategy rolling \
  --path $CF_PATH \
  --manifest $CF_MANIFEST \
  --vars-file $CF_VARS_FILE \
  --stack cflinuxfs4
