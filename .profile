export CF_API_USERNAME="$(echo $VCAP_SERVICES | jq -r '."user-provided"[] | select(.name == "federalist-deploy-user") | .credentials | .DEPLOY_USER_USERNAME')"
export CF_API_PASSWORD="$(echo $VCAP_SERVICES | jq -r '."user-provided"[] | select(.name == "federalist-deploy-user") | .credentials | .DEPLOY_USER_PASSWORD')"
