#!/bin/bash

set -e

CF_ORGANIZATION="gsa-18f-federalist"
CF_API="https://api.fr.cloud.gov"

if [ "$CIRCLE_BRANCH" == "master" ]; then
  CF_USERNAME=$CF_USERNAME_PRODUCTION
  CF_PASSWORD=$CF_PASSWORD_PRODUCTION
  CF_SPACE="production"
  CF_APP="federalistapp"
  CF_MANIFEST="manifest.yml"
elif [ "$CIRCLE_BRANCH" == "staging" ]; then
  CF_USERNAME=$CF_USERNAME_STAGING
  CF_PASSWORD=$CF_PASSWORD_STAGING
  CF_SPACE="staging"
  CF_APP="federalistapp-staging"
  CF_MANIFEST="staging_manifest.yml"
else
  echo "Current branch has no associated deployment. Exiting."
  exit
fi

# install cf cli
curl -L -o cf-cli_amd64.deb 'https://cli.run.pivotal.io/stable?release=debian64&source=github'
sudo dpkg -i cf-cli_amd64.deb
rm cf-cli_amd64.deb

# install autopilot
cf install-plugin autopilot -f -r CF-Community

cf api $CF_API
cf login -u $CF_USERNAME -p $CF_PASSWORD -o $CF_ORGANIZATION -s $CF_SPACE


echo "Deploying to $CF_SPACE space."
cf zero-downtime-push $CF_APP -f $CF_MANIFEST

if [ "$CIRCLE_BRANCH" == "master" ]; then
  cf add-network-policy federalist-build-container-1 --destination-app $CF_APP --protocol tcp --port 8080
  cf add-network-policy federalist-build-container-2 --destination-app $CF_APP --protocol tcp --port 8080
  cf add-network-policy federalist-build-container-3 --destination-app $CF_APP --protocol tcp --port 8080
  cf add-network-policy federalist-build-container-4 --destination-app $CF_APP --protocol tcp --port 8080
  cf add-network-policy federalist-build-container-5 --destination-app $CF_APP --protocol tcp --port 8080
  cf add-network-policy federalist-build-container-6 --destination-app $CF_APP --protocol tcp --port 8080
elif [ "$CIRCLE_BRANCH" == "staging" ]; then
  cf add-network-policy federalist-build-container-staging-1 --destination-app $CF_APP --protocol tcp --port 8080
  cf add-network-policy federalist-build-container-staging-2 --destination-app $CF_APP --protocol tcp --port 8080
fi

cf logout
