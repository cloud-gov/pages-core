#! /bin/bash

set -e

display_usage() {
  echo -e "\nUsage: $0 input.csv [max-rows] [offset]\n"
  echo -e "  max-rows: process at most this number of input rows (default: unlimited)\n"
  echo -e "  offset:   skip an initial set of input rows (default: 0)\n"
}

if [  $# -le 0 ]
then
  display_usage
  exit 1
fi

if [[ ( $@ == "--help") ||  $@ == "-h" ]]
then
  display_usage
  exit 0
fi

# Decision made to run this from a different environment. Hence:
# TODO: Eliminate input file and instead query DB from within the script
# TODO: Eliminate SQL output and instead update DB from within primary loop

# Expected input file is a comma-seperated-value export of the serviceName and
# origin columns for provisioned domains in the domains table in the core DB.
#
# The expected format can be produced from the psql command line as follows:
#
# \copy (select "serviceName",origin from domain where state='provisioned') to '/output/path/for/domains.csv' CSV HEADER;
domains_file=$1

max_rows=${2:--1}

offset=${3:-0}

if [[ ! -r $domains_file ]]
then
  echo "Input file $domains_file does not exist or is not readable"
  exit 1
fi

# QUESTION: Should this type of script test for CF session and/or verify targeted org/space?

# QUESTION: Does wait_for_service_instance() require the following?
#
# CF Auth
# cf api "${CF_API_URL}"
# (set +x; cf auth "${CF_USERNAME}" "${CF_PASSWORD}")

# Waiting for service instance to finish being processed.
wait_for_service_instance() {
  local service_name=$1
  local guid=$(cf service --guid $service_name)
  local status=$(cf curl /v2/service_instances/${guid} | jq -r '.entity.last_operation.state')

  while [ "$status" == "in progress" ]; do
    sleep 60
    status=$(cf curl /v2/service_instances/${guid} | jq -r '.entity.last_operation.state')
  done
}

rows_processed=0
SQL=""
while IFS="," read -r service_instance current_origin
do
  if [[ $offset -gt 0 ]]
  then
    ((offset--))
    continue
  fi

  ((rows_processed++))

  if [[ ($max_rows -gt 0) && ($rows_processed -gt $max_rows)]]
  then
    break
  fi

  if [[ $current_origin =~ (.*)\.app\.cloud\.gov$ ]]
  then
    bucket=${BASH_REMATCH[1]}
    new_origin="$bucket.sites.pages.cloud.gov"

    # For the moment, outputting instead of executing this command...
    echo "cf update-service $service_instance -c '{\"origin\": \"$new_origin\"}'"

    # ... and since we're not executing that we're not yet going to
    # wait_for_service_instance $SERVICE_INSTANCE"

    # Here's the SQL we'll need to run to update the database once the origin is updated
    SQL+="update domain set origin='$new_origin' where \"serviceName\"='$service_instance';"$'\n'
  fi
done < $domains_file

# TODO: Ensure that this happens even if an error occurs in the loop above
if [[ ${#SQL} -gt 0 ]]
then
  echo -e "\nThe following SQL will need to be executed against the database:\n"
  echo "$SQL"
fi
