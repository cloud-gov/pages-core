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

# Run the export script on the instance
cf ssh $APP_NAME <<EOD
cd app
PORT=4000 timeout 5s .heroku/node/bin/node scripts/exportSitesAsCsv.js
EOD

# Get the necessary values to scp to the instance
APP_GUID=$(cf app $APP_NAME --guid)
SSH_PASS=$(cf ssh-code)
CF_USERNAME="cf:$APP_GUID/0"

# Use scp to download the file
expect <<EOD
spawn scp -P 2222 -o "User $CF_USERNAME" ssh.fr.cloud.gov:/home/vcap/app/current-sites.csv ./current-sites.csv
expect "assword: "
send "$SSH_PASS\r"
sleep 2
EOD
