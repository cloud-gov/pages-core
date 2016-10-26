#!/bin/bash

set -e
set -u

time npm install
npm run build
time rm -rf ./node_modules
time npm install --production
