#!/bin/bash

# Exit if we are not targetting the correct space
if ! cf target | grep "Org: \s*gsa-18f-federalist"; then
  echo "This command must be run while targeting the gsa-18f-federalist org"
  exit 1
fi

# Make sure we're using the correct app
if cf target | grep "Space: \s*staging"; then
  APP_NAME="federalist-staging"
elif cf target | grep "Space: \s*production"; then
  APP_NAME="federalist"
fi

# Cleanup any old data
if [[ -f current-sites.csv ]]; then
  rm current-sites.csv
fi

# Run the export script on the instance
cf ssh $APP_NAME <<EOD
cd app
PORT=4000 timeout 5s .heroku/node/bin/node scripts/exportSitesAsCsv.js
EOD

# Download current-sites.csv
cf ssh $APP_NAME -c "cat /home/vcap/app/current-sites.csv" >> ./current-sites.csv

# Instructions
echo "Sites exported to $(pwd)/current-sites.csv"
