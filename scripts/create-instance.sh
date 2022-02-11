#!/bin/bash

set -e

add_ext_if_not_prod () {
  local prefix=$1
  local env=$2

  if [[ $env != "production" ]]; then
    prefix+="-${env}"
  fi

  echo $prefix
}

## Before Run
# - Create Github OAuth with callback url https://$domain and set env vars
# - Create required domain
# - Create required DNS records for the external domain service

echo

show_usage="false"

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--env_type) env_type="$2"; shift; shift ;;
    -d|--domain) domain="$2"; shift; shift ;;
    -h|--help) show_usage="true"; shift; shift ;;
    -o|--org) cf_org="$2"; shift; shift ;;
    -p|--product) product="$2"; shift; shift ;;
    -s|--subdomain) subdomain="$2"; shift; shift ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

set -- "${POSITIONAL[@]}" # restore positional parameters

cf_space="$1"

if [[ "${show_usage}" != "true" ]]; then

  if [[ -z "$cf_space" ]] \
    || [[ -z "$env_type" ]] \
    || [[ -z "$domain" ]] \
    || [[ -z "$cf_org" ]] \
    || [[ -z "$product" ]] \
    || [[ -z "$proxy_domain" ]] \
    || [[ -z "$GITHUB_CLIENT_ID" ]] \
    || [[ -z "$GITHUB_CLIENT_SECRET" ]]; then
      echo "Missing required arguments or environment variables."
      echo
      show_usage="true"
  fi

  if [[ "$product" = "pages" ]]; then
    if [[ -z "$UAA_DOMAIN" ]] \
      || [[ -z "$UAA_CLIENT_ID" ]] \
      || [[ -z "$UAA_CLIENT_SECRET" ]]
      || [[ -z "$SLACK_URL" ]]; then
        echo "Missing required arguments or environment variables for 'pages' deployment."
        echo
        show_usage="true"
    fi
  fi
fi

if [[ "${show_usage}" = "true" ]] ; then
  echo "Usage: ./create-infra [options...] <space>"
  echo " -e, --env_type <env_type>          The type of environment, ex. 'dev', 'staging', 'production'"
  echo " -d, --domain <domain>              The parent application domain, ex. 'federalistapp.18f.gov', 'pages-staging.cloud.gov'"
  echo " -o, --org <org>                    The cloud foundry organization, ex. 'gsa-18f-federalist'"
  echo " -p, --product <product>            'federalist' or 'pages'"
  echo " -x, --proxy_domain <proxy_domain>  The proxy domain, ex. 'app.cloud.gov', 'sites.pages-staging.cloud.gov'"
  echo
  echo " -h, --help                         Show help"
  echo
  echo "Prerequisites:"
  echo "  - Desired domain exists in cloud.gov"
  echo "  - Github OAuth app with correct callback url"
  echo "  - UAA Client (for pages)"
  echo "  - Slack webhook URL (pages)"
  echo "  - Already be authenticate with the cf cli and have necessary permissions"
  echo
  echo "Required environment variables:"
  echo "  From a Github OAuth application:"
  echo "    GITHUB_CLIENT_ID"
  echo "    GITHUB_CLIENT_SECRET"
  echo "  From a UAA client: (pages)"
  echo "    UAA_DOMAIN"
  echo "    UAA_CLIENT_ID"
  echo "    UAA_CLIENT_SECRET"
  echo "  From Slack: (pages)"
  echo "    SLACK_URL"
  echo
  echo "Example:"
  echo "  ./create-infra.sh -e staging -d federalistapp-staging.18f.gov -o gsa-18f-federalist -p federalist -x app.cloud.gov staging"

  exit 1
fi

echo "Creating infrastructure for ${cf_space}!!\n\n"

##
# Set Variables
##
cf_prefix="${product}-${env_type}"

# App Names
admin_name=$(add_ext_if_not_prod "${product}-admin" "${env_type}")
build_container_name=$(add_ext_if_not_prod "${product}-build-container" "${env_type}")
build_container_exp_name=$(add_ext_if_not_prod "${product}-build-container-exp" "${env_type}")
builder_name=$(add_ext_if_not_prod "${product}-builder" "${env_type}")
proxy_name=$(add_ext_if_not_prod "${product}-proxy" "${env_type}")
queues_ui_name=$(add_ext_if_not_prod "${product}-queues-ui" "${env_type}")
webapp_prefix=""
if [[ "$product" = "federalist" ]]; then
  webapp_prefix="federalistapp"
else
  webapp_prefix="pages"
fi
webapp_name=$(add_ext_if_not_prod "${webapp_prefix}" "${env_type}")

# Service Names
service_name_rds="${cf_prefix}-rds"
service_name_redis="${cf_prefix}-redis"
service_name_sqs="${cf_prefix}-sqs-creds"
service_name_s3="${cf_prefix}-s3"
service_name_s3_build_logs="${cf_prefix}-s3-build-logs"
service_name_uev_key="${cf_prefix}-uev-key"
service_name_cf_api_user="${cf_prefix}-cf-api-user"
service_name_cf_ci_user="${cf_prefix}-cf-ci-user"
service_name_cf_creds="federalist-deploy-user"
service_name_sitewide_error="federalist-site-wide-error"
service_name_env="${cf_prefix}-env"
service_name_proxy="${cf_prefix}-proxy"
service_name_domain="${cf_prefix}-domain"
service_name_space="${cf_prefix}-space"
service_name_uaa="app-${env_type}-uaa-client"

cf_sites_space=$(add_ext_if_not_prod "sites" "${env_type}")
##

##
# Create Spaces
##
cf create-space "${cf_space}" -o "${cf_org}"
cf create-space "${cf_sites_space}" -o "${cf_org}"
##

cf target -s "${cf_space}" -o "${cf_org}"

##
# Create Apps
##
cf create-app $admin_name
cf create-app $build_container_name --app-type docker
cf create-app $build_container_exp_name --app-type docker
cf create-app $builder_name
cf create-app $proxy_name
cf create-app $queues_ui_name
cf create-app $webapp_name
##

##
# Create Services
##
cf create-service aws-rds micro-psql "${service_name_rds}"
cf create-service aws-elasticache-redis redis-dev "${service_name_redis}"
cf create-service s3 basic-public "${service_name_s3}"
cf create-service s3 basic "${service_name_s3_build_logs}"
cf create-service cloud-gov-service-account space-deployer "${service_name_cf_api_user}"
cf create-service-key "${service_name_cf_api_user}" "${service_name_cf_api_user}-key"
cf create-service cloud-gov-service-account space-deployer "${service_name_cf_ci_user}"
cf create-service-key "${service_name_cf_ci_user}" "${service_name_cf_ci_user}-key"
cf create-user-provided-service "${service_name_sitewide_error}" -p '{"BODY": "", "HEADING": ""}'
cf create-user-provided-service "${service_name_sqs}" -p '{"sqs_url": ""}'
cf create-user-provided-service "${service_name_uev_key}" \
  -p "$(cat <<- EOF
    {
      "key": "$(openssl rand -hex 20)"
    }
EOF
)"

cf create-user-provided-service "${service_name_env}" \
  -p "$(cat <<- EOF
    {
      "FEDERALIST_SESSION_SECRET": "$(openssl rand -hex 25)",
      "GITHUB_CLIENT_CALLBACK_URL": "https://${domain}/auth/github/callback",
      "GITHUB_CLIENT_EXTERNAL_CALLBACK_URL": "https://${domain}/external/auth/github/callback",
      "GITHUB_CLIENT_ID": "${GITHUB_CLIENT_ID}",
      "GITHUB_CLIENT_SECRET": "${GITHUB_CLIENT_SECRET}",
      "GITHUB_WEBHOOK_SECRET": "$(openssl rand -hex 20)",
      "GITHUB_WEBHOOK_URL": "https://${domain}/webhook/github"
    }
EOF
)"

cf create-user-provided-service "$service_name_proxy" \
  -p "$(cat <<- EOF
    {
      "guid": "$(cf app ${proxy_name} --guid)"
    }
EOF
)"

cf create-user-provided-service "${service_name_domain}" \
  -p "$(cat <<- EOF
    {
      "guid": "$(cf curl "/v3/domains?names=${proxy_domain}" | jq -r '.resources[0].guid')"
    }
EOF
)"

cf create-user-provided-service "${service_name_space}" \
  -p "$(cat <<- EOF
    {
      "guid": "$(cf space ${cf_space} --guid)"
    }
EOF
)"

api_user_password=$(cf service-key "${service_name_cf_api_user}" "${service_name_cf_api_user}-key" | tail -n +2 | jq -r '.password')
api_user_username=$(cf service-key "${service_name_cf_api_user}" "${service_name_cf_api_user}-key" | tail -n +2 | jq -r '.username')
cf create-user-provided-service "${service_name_cf_creds}" \
  -p "$(cat <<- EOF
    {
      "DEPLOY_USER_PASSWORD": "${api_user_password}",
      "DEPLOY_USER_USERNAME": "${api_user_username}"
    }
EOF
)"

# Grant permissions in the sites space
cf set-space-role "${api_user_username}" "${cf_org}" "${cf_sites_space}" "SpaceDeveloper"

# Temporarily create a service key to get the bucket name
tmp_s3_service_key_name="${service_name_s3}-key-tmp"
cf create-service-key "${service_name_s3}" "${tmp_s3_service_key_name}"
shared_bucket=$(cf service-key "${service_name_s3}" "${tmp_s3_service_key_name}" | tail -n +2 | jq -r .bucket)
cf delete-service-key "${service_name_s3}" "${tmp_s3_service_key_name}" -f
##

##
# Set Security Groups
##
cf bind-security-group trusted_local_networks_egress "${cf_org}" --lifecycle running --space "${cf_space}"
cf bind-security-group public_networks_egress "${cf_org}" --lifecycle running --space "${cf_space}"
##

##
# Create External Domains
##
cf create-service external-domain domain-with-cdn "${domain}-ext" \
  -c "$(cat <<- EOF
    {
      "domains": "${domain}"
    }
EOF
)"


cf create-service external-domain domain-with-cdn "admin.${domain}-ext" \
  -c "$(cat <<- EOF
    {
      "domains": "admin.${domain}"
    }
EOF
)"  

cf create-service external-domain domain-with-cdn "queues.${domain}-ext" \
  -c "$(cat <<- EOF
    {
      "domains": "queues.${domain}"
    }
EOF
)"
##

# Outputs
ci_user_password=$(cf service-key "${service_name_cf_ci_user}" "${service_name_cf_ci_user}-key" | tail -n +2 | jq -r '.password')
ci_user_username=$(cf service-key "${service_name_cf_ci_user}" "${service_name_cf_ci_user}-key" | tail -n +2 | jq -r '.username')
##

##
# Pages!
##
if [[ "$product" = "pages" ]]; then
  echo "Configuring services for Pages"

  # Configure UAA 
  uaa_service_creds="$(cat <<- EOF
    {
      "authorizationURL": "https://login.${UAA_DOMAIN}/oauth/authorize",
      "clientID": "${UAA_CLIENT_ID}",
      "clientSecret": "${UAA_CLIENT_SECRET}",
      "logoutURL": "https://uaa.${UAA_DOMAIN}/logout.do",
      "tokenURL": "https://uaa.${UAA_DOMAIN}/oauth/token",
      "userURL": "https://uaa.${UAA_DOMAIN}/userinfo"
    }
EOF
)"

  # Create Mailer creds and network policy
  cf target -s email -o "${cf_org}"
  auth_service_guid=$(cf curl '/v3/service_instances?names=auth' | jq -r '.resources[0].guid')
  mailer_password=$(cf curl "/v3/service_instances/${auth_service_guid}/credentials" | jq -r '.password')
  mailer_username=$(cf curl "/v3/service_instances/${auth_service_guid}/credentials" | jq -r '.username')

  cf target -s "${cf_space}" -o "${cf_org}"

  mailer_creds="$(cat <<- EOF
    {
      "host": "pages-mailer.apps.internal:8000",
      "password": "${mailer_password}",
      "username": "${mailer_username}"
    }
EOF
)"

  slack_creds="$(cat <<- EOF
    {
      "url": "${SLACK_URL}"
    }
EOF
)"

  # Create Network Policy
  cf add-network-policy $web_app_name pages-mailer -s email -o ${org_name}
else
  uaa_service_creds="$(cat <<- EOF
    {
      "authorizationURL": "",
      "clientID": "",
      "clientSecret": "",
      "logoutURL": "",
      "tokenURL": "",
      "userURL": ""
    }
EOF
)"

  mailer_creds="$(cat <<- EOF
    {
      "host": "",
      "password": "",
      "username": ""
    }
EOF
)"

  slack_creds="$(cat <<- EOF
    {
      "url": ""
    }
EOF
)"
fi

cf create-user-provided-service "${service_name_uaa}" -p "${uaa_service_creds}"
cf create-user-provided-service mailer -p "${mailer_creds}"
cf create-user-provided-service slack -p "${slack_creds}"
##

## All done!!
echo "Infrastructure created for ${cf_space}!!"
echo
echo
echo "Please finish the configuration by doing the following:"
echo
echo "-  In the ${product}-proxy-${env_type} ${cf_space} vars file, please set 'shared-bucket=${shared_bucket}'"
echo
echo "-  In the Concourse jumpbox, please run the following:"
echo "     credhub set -n /concourse/pages/${cf_space}-cf-password -t value -v ${ci_user_password}"
echo "     credhub set -n /concourse/pages/${cf_space}-cf-username -t value -v ${ci_user_username}"
echo
echo "-  Add any additional humans:"
echo "     cf set-space-role <username@gsa.gov> ${cf_org} ${cf_space} SpaceDeveloper"
echo "     cf set-space-role <username@gsa.gov> ${cf_org} ${cf_sites_space} SpaceDeveloper"
echo
echo "You may now deploy the pages and applications:"
echo
if [[ "$product" = "pages" ]]; then
  echo "- Bootstrap admins 'cf run-task <web app name> --name \"Bootstrap Admins\" --command \"yarn bootstrap-admins <uaa admin group name>\""
  echo
fi

# Do we need to seed organization roles???