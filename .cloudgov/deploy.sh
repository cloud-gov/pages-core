#! /bin/bash
set -o pipefail

onerr() {
  if [ $1 = true ]; then
    echo "Deployment to $CF_SPACE space failed, cancelling."
    cf7 cancel-deployment $CF_APP
  fi
  cf7 logout
  exit 1
}
trap 'onerr $DEPLOY_STARTED' ERR

CF_API="https://api.fr.cloud.gov"
CF_ORGANIZATION="gsa-18f-federalist"

DEPLOY_STARTED=false

curl -L -o cf7.deb 'https://packages.cloudfoundry.org/stable?release=debian64&version=v7&source=github' \
  && sudo dpkg -i cf7.deb \
  && rm cf7.deb

cf7 api $CF_API

echo "Logging in to $CF_ORGANIZATION org, $CF_SPACE space."
cf7 login -u $CF_USERNAME -p $CF_PASSWORD -o $CF_ORGANIZATION -s $CF_SPACE

echo "Deploying to $CF_SPACE space."
DEPLOY_STARTED=true
cf7 push $CF_APP --strategy rolling --vars-file $CF_VARS_FILE -f $CF_MANIFEST

cf7 logout