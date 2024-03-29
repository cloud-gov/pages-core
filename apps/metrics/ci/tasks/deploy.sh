#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

cf push $CF_APP_NAME --stack $CF_STACK \
  $(env | grep ^CFVAR_ | sed 's/CFVAR_/--var /')
