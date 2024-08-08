#!/bin/bash

set -e
# shellcheck disable=SC2002
cat user.json | jq -r '.cookies[0] | .name, .value' | paste -sd "=" - > cookie
