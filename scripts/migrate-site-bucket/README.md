migrate site bucket
===================

A guide to migrating a site from the shared bucket to the dedicated bucket

## Deploying the task runner

```bash
# Migrating the staging sites
$ cf push -f manifest-staging.yml --health-check-type none --no-route

# Migrating the production sites
$ cf push -f manifest.yml --health-check-type none --no-route

# Running the tasks in staging example
$ cf run-task federalist-bucket-migrator-worker-staging "/app/migrate-site-bucket.sh migrate <owner> <repo> [site url] [demo url]"

# Check on tasks
$ cf tasks federalist-bucket-migrator-worker-staging
```

## Running the script locally

This script migrates a site using the shared bucket into its own dedicated bucket

### DEPENDENCIES
- Cloud Foundry CLI (https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)
- CF Service Connect (https://github.com/18F/cf-service-connect#readme)
- PSQL (https://www.postgresql.org/docs/current/app-psql.html)
- AWS CLI (https://aws.amazon.com/cli/)
- JQ CLI (https://stedolan.github.io/jq/)

### PERMISSIONS
User running the script must have the authorization to access the `gsa-18f-federalist`

### CREATING AN SSH SESSION
To get connection to the database you will need to open up an ssh session using the
`cf connect-to-service` in another terminal session.  You can start a session with this script
by running `$> bash ./scripts/migrate-site-bucket startssh <APP NAME> <DATABASE SERVICE NAME>`

Use the values to connect to the database
```bash
# Output
Host: <host>
Port: <port>
Username: <database user>
Password: <database password>
Name: <database name>
```

### RUNNING THE SCRIPT

The steps to start migrating sites

In a seperate terminal tab or window start an database ssh session by running
- Run `$ bash ./scripts/migrate-site-bucket.sh startssh <CF Space => "staging">`
- Save all of the database username, password, host, port, and name

Open a new terminal tab to see all available sites to migrate
- Run `$ bash ./scripts/migrate-site-bucket.sh getsites db_user db_password db_host db_port db_name`
- This returns all applicable site owner, repository, domain, demo domain, s3 service name, s3 bucket name

Select a site to migrate and run the migration script
__Run:__
```bash
    $ bash ./scripts/migrate-site-bucket.sh migrate \
        <owner> \
        <repo> \
        <cf space> \
        <db user> \
        <db password> \
        <db host> \
        <db port> \
        <db name> \
        <site url> \
        <demo url>
```
