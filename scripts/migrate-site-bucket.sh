#! /bin/bash

# README
# This script migrates a site using the shared bucket into its own dedicated bucket

# DEPENDENCIES
# - Cloud Foundry CLI (https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)
# - CF Service Connect (https://github.com/18F/cf-service-connect#readme)
# - PSQL (https://www.postgresql.org/docs/current/app-psql.html)
# - AWS CLI (https://aws.amazon.com/cli/)
# - JQ CLI (https://stedolan.github.io/jq/)

# PERMISSIONS
# User running the script must have the authorization to access the `gsa-18f-federalist`

# CREATING AN SSH SESSION
# To get connection to the database you will need to open up an ssh session using the
# `cf connect-to-service` in another terminal session.  You can start a session with this script
# by running `$> bash ./scripts/migrate-site-bucket startssh <APP NAME> <DATABASE SERVICE NAME>`

# Use the values to connect to the database
# Host: <host>
# Port: <port>
# Username: <database user>
# Password: <database password>
# Name: <database name>

# RUNNING THE SCRIPT

COMMAND=$1

## Start an ssh session
function startssh() {
    app=$1
    service=$2
    cf connect-to-service --no-client $app $service
}

if [ "$COMMAND" == "startssh" ]; then
    startssh $2 $3
fi

function waitfor() {
    secs=$1
    msg=$2
    echo "Waiting for $secs seconds."

    if [ "$msg" != "" ]; then
      echo "$msg"
    fi
    sleep $secs
}


## Set AWS S3 Credentials
function set_s3_credentials() {
  SERVICE_INSTANCE_NAME="$1"
  KEY_NAME="$SERVICE_INSTANCE_NAME-key"

  S3_CREDENTIALS=`cf service-key $SERVICE_INSTANCE_NAME $KEY_NAME | tail -n +2`

  export AWS_ACCESS_KEY_ID=`echo "$S3_CREDENTIALS" | jq -r .access_key_id`
  export AWS_SECRET_ACCESS_KEY=`echo "$S3_CREDENTIALS" | jq -r .secret_access_key`
  export BUCKET_NAME=`echo "$S3_CREDENTIALS" | jq -r .bucket`
  export AWS_DEFAULT_REGION=`echo "$S3_CREDENTIALS" | jq -r '.region'`
}

## Copy Site from shared to dedicated bucket
function cp_site() {
    shared_service=$1
    owner=$2
    repo=$3
    proxy_url='https://federalist-proxy-staging.app.cloud.gov'
    dedicated_service="owner-$owner-repo-$repo"
    tmp_dir="./tmp-$dedicated_service"
    site_path="/site/$owner/$repo/"

    set_s3_credentials $shared_service

    echo "Copying site from \"$BUCKET_NAME$site_path\""
    # aws s3 sync s3://$BUCKET_NAME$site_path $tmp_dir --content-encoding

    file_urls=$(aws s3 ls --recursive s3://$BUCKET_NAME/site/$owner/$repo/ | tr -s ' ' '^' | cut -d'^' -f4)

    for file_url in $file_urls; do
        # echo "$tmp_dir/$file_url"
        curl $proxy_url/$file_url --create-dirs -o "$tmp_dir/$file_url"
    done

    set_s3_credentials $dedicated_service

    echo "Copying site to \"$BUCKET_NAME$site_path\""
    aws s3 sync $tmp_dir/site s3://$BUCKET_NAME/site

    rm -rf $tmp_dir
}

if [ "$COMMAND" == "cp_site" ] && [ "$2" != "help" ]; then
    cp_site $2 $3 $4
fi

## Get a list of sites to migrate
GET_SITES_SQL="select
    owner,
    repository,
    domain, \"demoDomain\",
    \"awsBucketName\",
    \"s3ServiceName\"
from site
    where \"s3ServiceName\" = 'federalist-staging-s3'
    and \"deletedAt\" is NULL;
"

function getsites() {
    user=$1
    password=$2
    host=$3
    port=$4
    name=$5
    connection_string="postgres://$user:$password@$host:$port/$name"

    psql $connection_string -c "$GET_SITES_SQL"
}

if [ "$COMMAND" == "getsites" ] && [ "$2" != "help" ]; then
    getsites $2 $3 $4 $5 $6
fi

if [ "$COMMAND" == "getsites" ] && [ "$2" == "help" ]; then
    echo 'HELP'
    echo ''
    echo "\"$COMMAND\" takes five arguments in order: database user, password, host, port, name"
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh getsites <user> <password> <host> <port> <name>"
    echo ''
    echo ''
fi


## Start psql session
function startpsql() {
    user=$1
    password=$2
    host=$3
    port=$4
    name=$5
    connection_string="postgres://$user:$password@$host:$port/$name"

    psql $connection_string
}

if [ "$COMMAND" == "startpsql" ] && [ "$2" != "help" ]; then
    startpsql $2 $3 $4 $5 $6
fi


## Setup Bucket Website
function put_bucket() {
    owner=$1
    repo=$2
    bucket=$3

    aws s3api put-bucket-website --bucket $bucket \
         --website-configuration \
         "{\"ErrorDocument\": {\"Key\": \"site/$owner/$repo/404.html\"},\"IndexDocument\": {\"Suffix\": \"index.html\"}}"
 }

## Create new infrastructure for site
function create_infrastructure() {
    owner=$1
    repo=$2
    proxy_app=$3
    space=$4
    s3_service_name="owner-$owner-repo-$repo"

    cf cs s3 basic-public $s3_service_name
    cf csk $s3_service_name "$s3_service_name-key"

    set_s3_credentials $s3_service_name

    # Wait for credentials to be provisioned
    waitfor 10 "Provisioning S3 credentials for $s3_service_name"

    put_bucket $owner $repo $BUCKET_NAME

    echo "Proxy: $proxy_app"
    cf create-route $space app.cloud.gov --hostname $BUCKET_NAME $proxy_app
    cf map-route $proxy_app app.cloud.gov --hostname $BUCKET_NAME
}

if [ "$COMMAND" == "create_infrastructure" ] && [ "$2" != "help" ]; then
    create_infrastructure $2 $3 $4 $5
    echo $AWS_ACCESS_KEY_ID
    echo $AWS_SECRET_ACCESS_KEY
    echo $BUCKET_NAME
    echo $AWS_DEFAULT_REGION
fi

if [ "$COMMAND" == "create_infrastructure" ] && [ "$2" == "help" ]; then
    echo 'HELP'
    echo ''
    echo "\"$COMMAND\" takes three arguments in order: owner, repository, proxy_app_name"
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh create_infrastructure <owner> <repo> <proxy app name>"
    echo ''
    echo ''
fi

## Delete infrastructure for site
function delete_infrastructure() {
    owner=$1
    repo=$2
    s3_service_name="owner-$owner-repo-$repo"
    s3_service_key="$s3_service_name-key"

    set_s3_credentials $s3_service_name

    aws s3 rm --recursive s3://$BUCKET_NAME
    cf dsk $s3_service_name $s3_service_key -f
    cf ds $s3_service_name -f
    cf delete-route app.cloud.gov --hostname $BUCKET_NAME -f
}

if [ "$COMMAND" == "delete_infrastructure" ] && [ "$2" != "help" ]; then
    delete_infrastructure $2 $3 $4
fi


## Update CDN
function update_cdn() {
    domain=$1
    bucket=$2
    owner=$3
    repo=$4

    domain_route="$domain-route"
    origin="$bucket.app.cloud.gov"
    path="/site/$owner/$repo"

    cf target -s sites;

    cf update-service \
        $domain_route \
        -c "{\"domain\": \"$domain\",\"origin\": \"$origin\", \"path\": \"$path\"}";
}


## Run site migration
function migrate() {
    shared_service=$1
    owner=$2
    repo=$3
    proxy_app=$4
    space=$5

    # Set CF space
    cf target -s $space;

    # Create bucket, key, and route
    create_infrastructure $owner $repo $proxy_app $space;

    # Copy site from shared bucket into dedicated bucket
    cp_site $shared_service $owner $repo;
}

if [ "$COMMAND" == "migrate" ] && [ "$2" != "help" ]; then
    migrate $2 $3 $4 $5 $6
fi

if [ "$COMMAND" == "create_infrastructure" ] && [ "$2" == "help" ]; then
    echo 'HELP'
    echo ''
    echo "\"$COMMAND\" takes three arguments in order: shared bucket service name, owner, repository, proxy_app_name, cf space"
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh migrate <s3 shared service> <owner> <repo> <proxy app name> <space name>"
    echo ''
    echo ''
fi
