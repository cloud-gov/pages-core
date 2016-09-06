#!/bin/bash

set -e

cf api $CF_API
cf auth $CF_USERNAME $CF_PASSWORD && cf target -o $CF_ORGANIZATION -s $CF_SPACE

# Run autopilot plugin
cf zero-downtime-push $CF_APP -f manifest.yml -p .

cf logout
