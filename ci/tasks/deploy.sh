#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

echo "current dir"
pwd
echo "end current dir"

cf push $CF_APP_NAME -p $CF_PATH -f $CF_MANIFEST --strategy rolling --vars-file $CF_VARS_FILE