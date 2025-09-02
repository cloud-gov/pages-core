export CF_API_USERNAME="$(echo $VCAP_SERVICES | jq -r '."user-provided"[] | select(.name == "federalist-deploy-user") | .credentials | .DEPLOY_USER_USERNAME')"
export CF_API_PASSWORD="$(echo $VCAP_SERVICES | jq -r '."user-provided"[] | select(.name == "federalist-deploy-user") | .credentials | .DEPLOY_USER_PASSWORD')"
export SESSION_SECRET="$(echo "$VCAP_SERVICES" | jq --raw-output --arg service_name "pages-$APP_ENV-env" ".[][] | select(.name == \$service_name) | .credentials.FEDERALIST_SESSION_SECRET")"
