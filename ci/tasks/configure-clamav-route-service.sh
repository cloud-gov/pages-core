#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

USER_PROVIDED_SERVICE_NAME=pages-clamav-rest-route-service-$APP_ENV
PAGES_APP=pages-$APP_ENV
ROUTE_SERVICE_APP=route-service-$APP_ENV
CLAMAV_REST_APP=pages-clamav-rest-$APP_ENV

if [ "$APP_ENV" = "production" ]; then
    PAGES_DOMAIN=pages.cloud.gov
else
    PAGES_DOMAIN=pages-$APP_ENV.cloud.gov
fi

ROUTE_SERVICE_APP_DOMAIN=$ROUTE_SERVICE_APP.$PAGES_DOMAIN

cf create-user-provided-service $USER_PROVIDED_SERVICE_NAME -r https://$ROUTE_SERVICE_APP_DOMAIN
cf create-route $PAGES_DOMAIN --path /v0/file-storage
cf map-route $PAGES_APP $PAGES_DOMAIN --path /v0/file-storage
cf bind-route-service $PAGES_DOMAIN --path /v0/file-storage $USER_PROVIDED_SERVICE_NAME
cf add-network-policy $ROUTE_SERVICE_APP $CLAMAV_REST_APP
