#!/bin/sh

set -e
set -o pipefail

wget http://go-cli.s3-website-us-east-1.amazonaws.com/releases/latest/cf-cli_amd64.deb -qO temp.deb && sudo dpkg -i temp.deb

rm temp.deb

cf api $CF_API
cf login --u $CF_USERNAME --p $CF_PASSWORD --o $CF_ORGANIZATION --s $CF_SPACE

./scripts/deploy.sh federalist

cf logout
