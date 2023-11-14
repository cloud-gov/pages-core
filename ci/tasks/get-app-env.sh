#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

echo "VCAP_SERVICES={`cf env $CF_APP_NAME | tail -n+3 | awk -v RS= 'NR==1' | tail -n+2 | tr -d '\n'`" >> .env
echo "VCAP_APPLICATION={`cf env $CF_APP_NAME | tail -n+3 | awk -v RS= 'NR==2' | tail -n+2 | tr -d '\n'`" >> .env
