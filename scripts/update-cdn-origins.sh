#! /bin/bash

set -e

# Process parameters
display_usage() {
  echo -e "\nUsage: $0 input.csv [max-rows] [offset]\n"
  echo -e "  max-rows: process at most this number of input rows (default: unlimited)\n"
  echo -e "  offset:   skip an initial set of input rows (default: 0)\n"
}

if [[ ( $@ == "--help") ||  $@ == "-h" ]]
then
  display_usage
  exit 0
fi

# Expected input file is a comma-seperated-value export of the serviceName and
# origin columns for provisioned domains in the domains table in the core DB.
#
# The expected format can be produced from the psql command line as follows:
#
# \copy (select id,"serviceName",origin from domain where state='provisioned' and origin like '%app.cloud.gov') to '/output/path/for/domains.csv' CSV;
domains_file=$1
max_domains=${2:--1}
offset=${3:-0}

if [[ ! -r $domains_file ]]
then
  echo "Input file $domains_file does not exist or is not readable"
  exit 1
fi

# Check for required environment variables
[ -z "${CF_API_URI}"  ] && { echo -e "\n Required CF_API_URI environment variable is not set\n";  exit 1; }
[ -z "${CF_USERNAME}" ] && { echo -e "\n Required CF_USERNAME environment variable is not set\n"; exit 1; }
[ -z "${CF_PASSWORD}" ] && { echo -e "\n Required CF_PASSWORD environment variable is not set\n"; exit 1; }
[ -z "${CF_ORG}"      ] && { echo -e "\n Required CF_ORG environment variable is not set\n"; exit 1; }
[ -z "${CF_SPACE}"    ] && { echo -e "\n Required CF_SPACE environment variable is not set\n"; exit 1; }

# Authenticate and set Cloud Foundry target
cf api "${CF_API_URI}"
(set +x; cf auth "${CF_USERNAME}" "${CF_PASSWORD}")
cf target -o "${CF_ORG}" -s "${CF_SPACE}"

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

# Iterate through domains in input file
domains_processed=0
SQL=""
while IFS="," read -r id service_instance current_origin
do
  if [[ $offset -gt 0 ]]
  then
    ((offset--))
    continue
  fi

  ((domains_processed++))

  if [[ ($max_domains -gt 0) && ($domains_processed -gt $max_domains)]]
  then
    break
  fi

  # Make sure the domain origin is of the old form
  if [[ $current_origin =~ (.*)\.app\.cloud\.gov$ ]]
  then
    bucket=${BASH_REMATCH[1]}
    new_origin="$bucket.sites.pages.cloud.gov"

    # Update the service
    echo "Updating $service_instance origin"
    cf update-service $service_instance -c '{"origin": "'$new_origin'"}'

    # Wait for update-service process to complete"
    echo "... waiting ..."
    wait_for_service_instance $service_instance
    echo "Service instance updated."

    # Here's the SQL we'll need to run to update the database once the origin is updated
    SQL+="update domain set origin='$new_origin' where id='$id';"$'\n'
  fi
done < $domains_file

# TODO: Ensure that this happens even if an error occurs in the loop above
if [[ ${#SQL} -gt 0 ]]
then
  echo -e "\nThe following SQL will need to be executed against the database:\n"
  echo "$SQL"
fi
