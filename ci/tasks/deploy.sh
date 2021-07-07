#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

INTERPOLATED_CF_VARS_FILE="$(dirname $CF_VARS_FILE)/interpolated-$(basename $CF_VARS_FILE)"

credhub interpolate -f $CF_VARS_FILE > $INTERPOLATED_CF_VARS_FILE

cf push $CF_APP_NAME -p $CF_PATH -f $CF_MANIFEST --strategy rolling --vars-file $INTERPOLATED_CF_VARS_FILE