#!/bin/bash

set -e

if [ "$CIRCLE_BRANCH" == "master" ]
then
  CF_USERNAME=$CF_USERNAME_PRODUCTION
  CF_PASSWORD=$CF_PASSWORD_PRODUCTION
  CF_SPACE="production"
  CF_APP="federalist"
  CF_MANIFEST="manifest.yml"
elif [ "$CIRCLE_BRANCH" == "staging" ]
then
  CF_USERNAME=$CF_USERNAME_STAGING
  CF_PASSWORD=$CF_PASSWORD_STAGING
  CF_SPACE="staging"
  CF_APP="federalist-staging"
  CF_MANIFEST="staging_manifest.yml"
else
  exit
fi

wget https://s3.amazonaws.com/go-cli/releases/v6.12.4/cf-cli_amd64.deb -qO temp.deb && sudo dpkg -i temp.deb

rm temp.deb

cf api $CF_API
cf login -u $CF_USERNAME -p $CF_PASSWORD -o $CF_ORGANIZATION -s $CF_SPACE

cf zero-downtime-push $CF_APP -f $CF_MANIFEST

cf logout
