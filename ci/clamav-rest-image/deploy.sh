#!/bin/bash

set -ex

ecr_repository=$(cat clamav-rest-image/repository)
image_version=$(cat clamav-rest-image/tag)

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

cf push -f source/cf/manifest.yml \
    -i $CLAMAV_REST_INSTANCES \
    --var app_name=${CLAMAV_REST_HOSTNAME} \
    --var docker_username=${CF_DOCKER_USERNAME} \
    --var ecr_repository=${ecr_repository} \
    --var route=${CLAMAV_REST_HOSTNAME}.${CLAMAV_REST_DOMAIN} \
    --var image_version=${image_version}

cf set-env ${CLAMAV_REST_HOSTNAME} MAX_FILE_SIZE 250M
cf set-env ${CLAMAV_REST_HOSTNAME} MAX_SCAN_SIZE 250M
cf restage ${CLAMAV_REST_HOSTNAME}

#cf ssh pages-clamav-rest-dev -c "
#  sed -i 's/MaxFileSize.*/MaxFileSize 250M/' /etc/clamav/clamd.conf
#  sed -i 's/MaxScanSize.*/MaxScanSize 250M/' /etc/clamav/clamd.conf
#  sed -i 's/StreamMaxLength.*/StreamMaxLength 250M/' /etc/clamav/clamd.conf
#"

for i in 0 1; do
  cf ssh pages-clamav-rest-dev -i $i -c "
    sed -i 's/MaxFileSize.*/MaxFileSize 250M/' /etc/clamav/clamd.conf
    sed -i 's/MaxScanSize.*/MaxScanSize 250M/' /etc/clamav/clamd.conf
    sed -i 's/StreamMaxLength.*/StreamMaxLength 250M/' /etc/clamav/clamd.conf
    pkill clamd
    sleep 2
    clamd &
  "
done

for i in 0 1; do
  echo "=== Instance $i ==="
  cf ssh pages-clamav-rest-dev -i $i -c "grep -E 'MaxFileSize|MaxScanSize|StreamMaxLength' /etc/clamav/clamd.conf"
  cf ssh pages-clamav-rest-dev -i $i -c "cat /etc/clamav/clamd.conf"
done

