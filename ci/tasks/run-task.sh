#!/bin/bash

set -e

cf api $CF_API
cf auth

cf t -o $CF_ORG -s $CF_SPACE

cf run-task $CF_APP_NAME --name $CF_TASK_NAME --command $CF_TASK_COMMAND