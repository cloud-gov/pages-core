#!/bin/bash

set -e

wget https://s3.amazonaws.com/go-cli/releases/v6.12.4/cf-cli_amd64.deb -qO temp.deb && sudo dpkg -i temp.deb

rm temp.deb

cf api $CF_API
cf login --u $CF_USERNAME --p $CF_PASSWORD --o $CF_ORGANIZATION --s $CF_SPACE

./scripts/deploy.sh $CF_APP

cf logout
