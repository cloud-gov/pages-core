#!/bin/bash

COMMAND=$1


## Get and assign user credentials
function set_vcap_vars() {
    export DEPLOY_USER_USERNAME=`echo $VCAP_SERVICES | jq -r '."user-provided"[0].credentials.DEPLOY_USER_USERNAME'`
    export DEPLOY_USER_PASSWORD=`echo $VCAP_SERVICES | jq -r '."user-provided"[0].credentials.DEPLOY_USER_PASSWORD'`
    export SITES_USER_USERNAME=`echo $VCAP_SERVICES | jq -r '."user-provided"[1].credentials.SITES_USER_USERNAME'`
    export SITES_USER_PASSWORD=`echo $VCAP_SERVICES | jq -r '."user-provided"[1].credentials.SITES_USER_PASSWORD'`
    export CF_ORGANIZATION_NAME=`echo $VCAP_APPLICATION | jq -r '."organization_name"'`
    export CF_SPACE_NAME=`echo $VCAP_APPLICATION | jq -r '."space_name"'`
    export CF_API="https://api.fr.cloud.gov"
}


## Sign in deploy user
function sign_in_deploy_user() {
    set_vcap_vars
    cf api $CF_API
    cf login -u $DEPLOY_USER_USERNAME -p $DEPLOY_USER_PASSWORD -o $CF_ORGANIZATION_NAME -s $CF_SPACE_NAME
}

if [ "$COMMAND" == "sign_in_deploy_user" ] && [ "$2" != "help" ]; then
    sign_in_deploy_user
fi


## Sign in sites user
function sign_in_sites_user() {
    set_vcap_vars
    cf api $CF_API
    cf login -u $SITES_USER_USERNAME -p $SITES_USER_PASSWORD -o $CF_ORGANIZATION_NAME -s 'sites'
}

if [ "$COMMAND" == "sign_in_sites_user" ] && [ "$2" != "help" ]; then
    sign_in_sites_user
fi


## Set variables base of space environment
function set_environment() {
    space=$1

    if [[ "$space" == "production" ]]; then
        federalist_app='federalistapp'
        shared_bucket_service='federalist-production-s3'
        database_service='federalist-production-rds'
        proxy_app='federalist-proxy'
    else
        federalist_app='federalistapp-staging'
        shared_bucket_service='federalist-staging-s3'
        database_service='federalist-staging-rds'
        proxy_app='federalist-proxy-staging'
    fi
}


## Start an ssh session based on a CF space
function startssh() {
    space=$1
    set_environment $space

    cf connect-to-service --no-client $federalist_app $database_service
}

if [ "$COMMAND" == "startssh" ]; then
    startssh $2
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
    proxy_url="https://$proxy_app.app.cloud.gov"
    dedicated_service=`generate_service_name $owner $repo`
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

## List Sites ready to be migrated
function getsites() {
    user=$1
    password=$2
    host=$3
    port=$4
    name=$5

    set_vcap_vars

    ## Get a list of sites to migrate
    GET_SITES_SQL="select
        owner,
        repository,
        domain, \"demoDomain\",
        \"awsBucketName\",
        \"s3ServiceName\"
    from site
        where \"s3ServiceName\" = 'federalist-$CF_SPACE_NAME-s3'
        and \"deletedAt\" is NULL
    order by
        owner asc;
    "

    if [[ -z $DATABASE_URL ]]; then
        connection_string="postgres://$user:$password@$host:$port/$name"
    else
        connection_string=$DATABASE_URL
    fi

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
    dedicated_service=`generate_service_name $owner $repo`

    # Set connection string
    if [[ -z $DATABASE_URL ]]; then
        connection_string="postgres://$user:$password@$host:$port/$name"
    else
        connection_string=$DATABASE_URL
    fi

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


## Generate service name
function generate_service_name() {
    owner=$1
    repo=$2
    service_name="o-$owner-r-$repo"
    service_length=`expr length $service_name`
    day=`date +%d`
    month=`date +%m`
    year=`date +%Y | cut -c3-4`

    if [[ $service_length > 46 ]]; then
        service_name=`echo $service_name | cut -c1-39`;
        service_name="$service_name-$day$month$year";
    fi

    echo $service_name
}


## Create new infrastructure for site
function create_infrastructure() {
    owner=$1
    repo=$2
    space=$3

    set_environment $space
    dedicated_bucket_service=`generate_service_name $owner $repo`

    # Set CF space
    cf target -s $space

    # Create dedicated bucket service and service key
    cf cs federalist-s3 basic-public $dedicated_bucket_service
    cf csk $dedicated_bucket_service "$dedicated_bucket_service-key"

    set_s3_credentials $dedicated_bucket_service

    # Wait for credentials to be provisioned
    waitfor 10 "Provisioning S3 credentials for $dedicated_bucket_service"

    # Put S3 bucket website confirguration on new, dedicated bucket service
    put_bucket $owner $repo $BUCKET_NAME

    # Create and map route for proxy based on <aws-bucket-name>.app.cloud.gov
    echo "Proxy: $proxy_app"
    cf create-route $space app.cloud.gov --hostname $BUCKET_NAME $proxy_app
    cf map-route $proxy_app app.cloud.gov --hostname $BUCKET_NAME
}

if [ "$COMMAND" == "create_infrastructure" ] && [ "$2" != "help" ]; then
    create_infrastructure $2 $3 $4
fi

if [ "$COMMAND" == "create_infrastructure" ] && [ "$2" == "help" ]; then
    echo 'HELP'
    echo ''
    echo "\"$COMMAND\" takes three arguments in order: owner, repository, CF space"
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh create_infrastructure <owner> <repo> <CF space>"
    echo ''
    echo ''
fi

## Delete infrastructure for site
function delete_infrastructure() {
    owner=$1
    repo=$2
    space=$3
    dedicated_bucket_service=`generate_service_name $owner $repo`
    s3_service_key="$dedicated_bucket_service-key"

    # Set CF space
    cf target -s $space

    # Set AWS credentials for dedicated bucket
    set_s3_credentials $dedicated_bucket_service

    # Delete aws s3 objects and destroy infrastructure
    aws s3 rm --recursive s3://$BUCKET_NAME
    cf dsk $dedicated_bucket_service $s3_service_key -f
    cf ds $dedicated_bucket_service -f
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

    cf target -s "sites";

    cf update-service \
        $domain_route \
        -c "{\"domain\": \"$domain\",\"origin\": \"$origin\", \"path\": \"$path\"}";
}

if [ "$COMMAND" == "update_cdn" ] && [ "$2" != "help" ]; then
    update_cdn ${2} ${3} ${4} ${5}
fi

## Run site migration in CF Task
function migrate() {
    owner=${1}
    repo=${2}
    site_url=${3}
    demo_url=${4}

    echo ""
    echo "Migration Settings"
    echo "owner $owner"
    echo "repo $repo"
    echo "site_url $site_url"
    echo "demo_url $demo_url"
    echo ""

    # Set CF environment variables
    set_vcap_vars

    # Set dedicated bucket service name
    dedicated_bucket_service=`generate_service_name $owner $repo`

    # Start time
    start_time=$(date +%s)

    # Set space environment variables
    set_environment $CF_SPACE_NAME

    # CF sign in as deploy user
    sign_in_deploy_user

    # Set CF space
    cf target -s $CF_SPACE_NAME;

    # Create bucket, key, and route
    echo "Creating Infrastructure"
    create_infrastructure_start=$(date +%s)
    create_infrastructure $owner $repo $CF_SPACE_NAME;
    echo "Created Infrastructure after $(($(date +%s)-$create_infrastructure_start)) seconds"

    # Copy site from shared bucket into dedicated bucket
    echo "Copying S3 site data to new site"
    copy_start=$(date +%s)
    cp_site $shared_bucket_service $owner $repo "site";
    cp_site $shared_bucket_service $owner $repo "demo";
    # Ignore copying over branches due to time and size constraints
    # cp_site $shared_bucket_service $owner $repo "preview";
    echo "Copied S3 site data after $((($(date +%s)-$copy_start)/60)) minutes"

    # Update database with new s3ServiceName and awsBucketName
    echo "Updating site table in database"
    update_site_start=$(date +%s)
    update_site_table $owner $repo
    echo "Updated site table after $(($(date +%s)-$update_site_start)) seconds"

    # Set CF space
    cf target -s $CF_SPACE_NAME;

    # Grab AWS credentials
    set_s3_credentials $dedicated_bucket_service

    if [[ ! -z $site_url ]]; then
        # CF sign in sites user
        echo "Updating site url CDN"
        site_cdn_start=$(date +%s)
        sign_in_sites_user

        # Update CDN
        update_cdn $site_url $BUCKET_NAME $owner $repo "site"
        echo "Updated site cdn after $(($(date +%s)-$site_cdn_start)) seconds"
    fi

    # CF sign in deploy user
    sign_in_deploy_user

    # Reset CF space to get AWS info
    cf target -s $CF_SPACE_NAME;

    # Grab AWS credentials
    set_s3_credentials $dedicated_bucket_service

    if [[ ! -z $demo_url ]]; then
        # CF sign in sites user
        echo "Updating demo url CDN"
        demo_cdn_start=$(date +%s)
        sign_in_sites_user

        # Update CDN
        update_cdn $demo_url $BUCKET_NAME $owner $repo "demo"
        echo "Updated demo cdn after $(($(date +%s)-$demo_cdn_start)) seconds"
    fi

    # End time
    end_time=$(date +%s)
    run_time=$(((end_time-start_time)/60))
    echo ""
    echo "Total Time: $run_time minutes"
    echo ""
}

if [ "$COMMAND" == "migrate" ] && [ "$2" != "help" ]; then
    migrate ${2} ${3} ${4} ${5}
fi

if [ "$COMMAND" == "migrate" ] && [ "$2" == "help" ]; then
    echo "HELP"
    echo ""
    echo "\"$COMMAND\" takes three arguments in order: "
    echo "      owner, repository, cf space, "
    echo "      db user, db password, db host, db port, db name, site url, demo url"
    echo ""
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh migrate \ "
    echo "                    <owner> \ "
    echo "                    <repo> \ "
    echo "                    <site_url> \ "
    echo "                    <demo_url>  "
    echo ""
    echo ""
fi

## Run site migration in CF Task
function migrate_local() {
    owner=${1}
    repo=${2}
    space=${3}
    user=${4}
    password=${5}
    host=${6}
    port=${7}
    name=${8}
    site_url=${9}
    demo_url=${10}

    echo ""
    echo "Migration Settings"
    echo "owner $owner"
    echo "repo $repo"
    echo "cf space $space"
    echo "user $user"
    echo "password $password"
    echo "host $host"
    echo "port $port"
    echo "name $name"
    echo "site_url $site_url"
    echo "demo_url $demo_url"
    echo ""

    # Set dedicated bucket service name
    dedicated_bucket_service=`generate_service_name $owner $repo`

    # Start time
    start_time=$(date +%s)

    # Set space environment variables
    set_environment $space

    # Set CF space
    cf target -s $space;

    # Create bucket, key, and route
    create_infrastructure $owner $repo $space;

    # Copy site from shared bucket into dedicated bucket
    cp_site $shared_bucket_service $owner $repo "site";
    cp_site $shared_bucket_service $owner $repo "demo";
    # Ignore copying over branches due to time and size constraints
    # cp_site $shared_bucket_service $owner $repo "preview";

    # Update database with new s3ServiceName and awsBucketName
    update_site_table $owner $repo $user $password $host $port $name

    # Set CF space to get AWS info
    cf target -s $space;

    # Grab AWS credentials
    set_s3_credentials $dedicated_bucket_service

    if [[ ! -z $site_url ]]; then
        update_cdn $site_url $BUCKET_NAME $owner $repo "site"
    fi

    # Reset CF space to get AWS info
    cf target -s $space;

    # Grab AWS credentials
    set_s3_credentials $dedicated_bucket_service

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

if [ "$COMMAND" == "migrate_local" ] && [ "$2" != "help" ]; then
    migrate_local ${2} ${3} ${4} ${5} ${6} ${7} ${8} ${9} ${10} ${11} ${12} ${13}
fi

if [ "$COMMAND" == "migrate_local" ] && [ "$2" == "help" ]; then
    echo "HELP"
    echo ""
    echo "\"$COMMAND\" takes three arguments in order: "
    echo "      owner, repository, cf space, "
    echo "      db user, db password, db host, db port, db name, site url, demo url"
    echo ""
    echo "      sEXAMPLE: $> ./scripts/migrate-site-bucket.sh migrate_local \ "
    echo "                    <owner> \ "
    echo "                    <repo> \ "
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
