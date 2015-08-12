#!/bin/sh

# Blue-green deployment script. Usage:
#
#   ./script/deploy <appname>
#
# Based on
#   http://www.cloudfoundry.rocks/blue-green-deployment-with-cloudfoundry/
#   http://docs.pivotal.io/pivotalcf/devguide/deploy-apps/blue-green.html
#   https://github.com/dlapiduz/step-cloud-foundry-deploy/blob/master/run.sh

set -e
set -o pipefail
set -x

BLUE=$1
GREEN="${BLUE}-B"


finally ()
{
  # we don't want to keep the sensitive information around
  rm $MANIFEST
}

on_fail () {
  finally
  echo "DEPLOY FAILED - you may need to check 'cf apps' and 'cf routes' and do manual cleanup"
}


# pull the up-to-date manifest from the BLUE (existing) application
MANIFEST=$(mktemp -t "${BLUE}_manifest")
cf create-app-manifest $BLUE -p $MANIFEST

# set up try/catch
# http://stackoverflow.com/a/185900/358804
trap on_fail ERR

DOMAIN=$(cat $MANIFEST | grep domain: | awk '{print $2}')

# create the GREEN application
cf push $GREEN -f $MANIFEST -n $GREEN
# ensure it starts
curl --fail -I "https://${GREEN}.${DOMAIN}"

# add the GREEN application to each BLUE route to be load-balanced
# TODO this output parsing seems a bit fragile...find a way to use more structured output
cf routes | grep $BLUE | awk '{print $3" -n "$2}' | xargs -n 3 cf map-route $GREEN

# cleanup
# TODO consider 'stop'-ing the BLUE instead of deleting it, so that depedencies are cached for next time
cf delete $BLUE -f
cf rename $GREEN $BLUE
cf delete-route $DOMAIN -n $GREEN -f
finally

echo "DONE"
