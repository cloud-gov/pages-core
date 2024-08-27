#!/bin/bash

set -e
# shellcheck disable=SC2002
# playwright uses an array of cookies
# to reuse this JSON and the script that generates, we set this to an object with
# keys as the first subdomain of the domain, and values as the cookie
cat user.json | jq -r '.cookies | map( { (.label): "\(.name)=\(.value)" } ) | add' > cookies.json
