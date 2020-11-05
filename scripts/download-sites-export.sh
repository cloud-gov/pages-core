#!/bin/bash

# Exit if we are not targetting the correct space
if ! cf target | grep "org: \s*gsa-18f-federalist"; then
  echo "This command must be run while targeting the gsa-18f-federalist org"
  exit 1
fi

# Make sure we're using the correct app
if cf target | grep "space: \s*staging"; then
  APP_NAME="federalistapp-staging"
elif cf target | grep "space: \s*production"; then
  APP_NAME="federalistapp"
fi

# Cleanup any old data
if [[ -f current-sites.csv ]]; then
  rm current-sites.csv
fi

# /home/vcap/app/.cloudfoundry/0/bin/node

# Run the export script on the instance
cf ssh $APP_NAME <<EOD
cd /home/vcap/app
PORT=4000 timeout 5s /home/vcap/app/.cloudfoundry/0/bin/node scripts/exportSitesAsCsv.js
EOD

# Download current-sites.csv
cf ssh $APP_NAME -c "cat /home/vcap/app/current-sites.csv" >> ./current-sites.csv

# Instructions
echo "Sites exported to $(pwd)/current-sites.csv"
