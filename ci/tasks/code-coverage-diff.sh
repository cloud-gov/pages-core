#!/bin/bash

set -e

source "$(dirname $PWD)/pipeline-tasks/scripts/github-setup.sh"

apt-get install jq -y

branch=$(jq '.[] | select(.name=="head_name") | .value' .git/resource/metadata.json | tr -d '"')
base_sha=$(jq '.[] | select(.name=="base_sha") | .value' .git/resource/metadata.json | tr -d '"')

# generate test coverage
yarn install
cov_cmd() { yarn test:rtl --coverageReporters json-summary --coverageDirectory tmp; }
tot_cmd() { jq '.["total"]["lines"]["pct"]' tmp/coverage-summary.json; }
cov_cmd
newcc=$(tot_cmd)
git checkout $base_sha
cov_cmd
oldcc=$(tot_cmd)
git switch -

diffcc=$(awk -v n1=$newcc -v n2=$oldcc -v OFMT="%.2f" 'BEGIN{print n1-n2}')
emoji=$([ ${diffcc:0:1} == "-" ] && echo ":chart_with_downwards_trend:" || echo ":chart_with_upwards_trend:")

body="## :robot: This is an automated code coverage report
  Total coverage (lines): **$newcc%**
  Coverage diff: **$diffcc%** $emoji
"

gh pr comment $branch --edit-last -b "$body" || gh pr comment $branch -b "$body"
