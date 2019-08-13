#!/bin/bash

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
SHARED_BUCKET_SERVICE='federalist-staging-s3'

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

## Check if s3 bucket file
function is_bucket_file() {
    file_name=$(echo $1 | rev | cut -d'/' -f1 | rev)

    if [[ $file_name == *.* ]]; then
        echo 'true'
    else
        echo 'false'
    fi
}

## Copy Site from shared to dedicated bucket
function cp_site() {
    shared_service=$1
    owner=$2
    repo=$3
    directory=$4
    proxy_url='https://federalist-proxy-staging.app.cloud.gov'
    dedicated_service="owner-$owner-repo-$repo"
    site_path="/$directory/$owner/$repo/"
    tmp_dir="./tmp-$directory-$owner-$repo"

    mkdir -p $tmp_dir

    set_s3_credentials $shared_service

    echo "Copying site from \"$BUCKET_NAME$site_path\""

    file_urls=$(aws s3 ls --recursive s3://$BUCKET_NAME$site_path | tr -s ' ' '^' | cut -d'^' -f4)

    for file_url in $file_urls; do
        is_file=$(is_bucket_file $file_url)

        if [[ $is_file == "false" ]]; then
            continue
        fi

        echo $is_file
        echo $file_url
        curl --create-dirs -o "$tmp_dir/$file_url" $proxy_url/$file_url
    done

    set_s3_credentials $dedicated_service

    echo "Copying site to \"$BUCKET_NAME$site_path\""
    aws s3 sync $tmp_dir/$directory s3://$BUCKET_NAME/$directory

    rm -rf $tmp_dir
}

if [ "$COMMAND" == "cp_site" ] && [ "$2" != "help" ]; then
    cp_site $2 $3 $4 $5
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

## List Sites ready to be migrated
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


## Update site s3ServiceName and awsBucketName after infrastructure migration
function update_site_table() {
    owner=$1
    repository=$2
    user=$3
    password=$4
    host=$5
    port=$6
    name=$7
    dedicated_service="owner-$owner-repo-$repo"
    connection_string="postgres://$user:$password@$host:$port/$name"

    # Set credentials to get new bucket name
    set_s3_credentials $dedicated_service

    UPDATE_SQL="
    update site
        set
            \"s3ServiceName\" = '$dedicated_service',
            \"awsBucketName\" = '$BUCKET_NAME'
        where
            owner = '$owner' and
            repository = '$repository';
    "

    psql $connection_string -c "$UPDATE_SQL"
}


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
    deploymnent=$5

    domain_route="$domain-route"
    origin="$bucket.app.cloud.gov"
    path="/$deploymnent/$owner/$repo"

    cf target -s sites;

    cf update-service \
        $domain_route \
        -c "{\"domain\": \"$domain\",\"origin\": \"$origin\", \"path\": \"$path\"}";
}

if [ "$COMMAND" == "update_cdn" ] && [ "$2" != "help" ]; then
    update_cdn ${2} ${3} ${4} ${5}
fi

## Run site migration
function migrate() {
    shared_service=${1}
    owner=${2}
    repo=${3}
    proxy_app=${4}
    space=${5}
    user=${6}
    password=${7}
    host=${8}
    port=${9}
    name=${10}
    site_url=${11}
    demo_url=${12}

    echo ""
    echo "Migration Settings"
    echo "shared_service $shared_service"
    echo "owner $owner"
    echo "repo $repo"
    echo "proxy_app $proxy_app"
    echo "space $space"
    echo "user $user"
    echo "password $password"
    echo "host $host"
    echo "port $port"
    echo "name $name"
    echo "site_url $site_url"
    echo "demo_url $demo_url"
    echo ""

    # Set additional variables
    s3_service_name="owner-$owner-repo-$repo"

    # Start time
    start_time=$(date +%s)

    # Set CF space
    cf target -s $space;

    # Create bucket, key, and route
    create_infrastructure $owner $repo $proxy_app $space;

    # Copy site from shared bucket into dedicated bucket
    cp_site $shared_service $owner $repo "site";
    cp_site $shared_service $owner $repo "demo";
    cp_site $shared_service $owner $repo "preview";

    # Update database with new s3ServiceName and awsBucketName
    update_site_table $owner $repo $user $password $host $port $name


    # Set CF space to get AWS info
    cf target -s $space;

    # Grab AWS credentials
    set_s3_credentials $s3_service_name

    if [[ ! -z $site_url ]]; then
        update_cdn $site_url $BUCKET_NAME $owner $repo "site"
    fi

    # Reset CF space to get AWS info
    cf target -s $space;

    # Grab AWS credentials
    set_s3_credentials $s3_service_name

    if [[ ! -z $demo_url ]]; then
        update_cdn $demo_url $BUCKET_NAME $owner $repo "demo"
    fi

    # End time
    end_time=$(date +%s)
    run_time=$(((end_time-start_time)/60))
    echo ""
    echo "Total Time: $run_time minutes"
    echo ""
}

if [ "$COMMAND" == "migrate" ] && [ "$2" != "help" ]; then
    migrate ${2} ${3} ${4} ${5} ${6} ${7} ${8} ${9} ${10} ${11} ${12} ${13}
fi

if [ "$COMMAND" == "migrate" ] && [ "$2" == "help" ]; then
    echo "HELP"
    echo ""
    echo "\"$COMMAND\" takes three arguments in order: shared bucket service name, owner, repository, proxy_app_name, cf space"
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh migrate \ "
    echo "                    <shared_service> \ "
    echo "                    <owner> \ "
    echo "                    <repo> \ "
    echo "                    <proxy_app> \ "
    echo "                    <space> \ "
    echo "                    <user> \ "
    echo "                    <password> \ "
    echo "                    <host> \ "
    echo "                    <port> \ "
    echo "                    <name> \ "
    echo "                    <site_url> \ "
    echo "                    <demo_url>  "
    echo ""
    echo ""
fi
