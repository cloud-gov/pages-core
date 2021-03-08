#!/usr/bin/env bash
set -euo pipefail

cd app

curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
chmod +x ./cc-test-reporter
./cc-test-reporter before-build

# yarn install
yarn test:cover; status=$?

# Combine the test coverage reports in coverage/server/ and coverage/client/
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.client.json coverage/client/lcov.info
./cc-test-reporter format-coverage -t lcov -o coverage/codeclimate.server.json coverage/server/lcov.info
./cc-test-reporter sum-coverage coverage/codeclimate.*.json
# Attempt to submit a report, but don't fail the build if this fails (`|| true`)
./cc-test-reporter upload-coverage || true

exit $status