#!/bin/bash

required="11.15.0"
actual=$(npm --version | cut -d. -f1)

if [ "$actual" -lt "$required" ]; then
  echo "npm version before: $(npm --version) update needed"
  npm install -g npm@11.14.1
  echo "npm version after: $(npm --version)"
else
  echo "npm version is already $(npm --version), no update needed"
fi