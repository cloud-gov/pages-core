#!/bin/bash

set -e
set +x

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

CFVARS=$(env | grep '^CFVAR_' | sed 's/CFVAR_//')

cf push $CF_APP_NAME -p $CF_PATH -f $CF_MANIFEST --strategy rolling --vars-file $CF_VARS_FILE $CFVARS