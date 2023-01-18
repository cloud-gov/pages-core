#! /bin/bash

set -e

display_usage() {
  echo -e "\nUsage: $0 input.csv\n"
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

# Expected input file is a comma-seperated-value export of the serviceName and
# origin columns for provisioned domains in the domains table in the core DB.
#
# The expected format can be produced from the psql command line as follows:
#
# \copy (select "serviceName",origin from domain where state='provisioned') to '/output/path/for/domains.csv' CSV HEADER;
DOMAINS_FILE=$1

if [[ ! -r $DOMAINS_FILE ]]
then
    echo "Input file $DOMAINS_FILE does not exist or is not readable"
    exit 1
fi


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

while IFS="," read -r service_instance current_origin
do
  if [[ $current_origin =~ (.*)\.app\.cloud\.gov$ ]]
  then
    bucket=${BASH_REMATCH[1]}
    new_origin="$bucket.sites.pages.cloud.gov"

    # QUESTION: service name vs service instance — does the arg below need to be a guid?
    # For the moment, outputting instead of executing this command...
    echo "cf update-service $service_instance -c '{\"origin\": \"$new_origin\"}'"

    # ... and since we're not executing that we're not yet going to
    # wait_for_service_instance $SERVICE_INSTANCE"

    # Here's the SQL we'll need to run to update the database once the origin is updated
    SQL="update domain set origin='$new_origin' where \"serviceName\"='$service_instance';"
    echo $SQL
    echo
  fi
done < $DOMAINS_FILE
