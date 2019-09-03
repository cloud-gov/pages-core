migrate site bucket
===================

A guide to migrating a site from the shared bucket to the dedicated bucket

## Using CF task runners

Using Cloud Foundry's task runners for site migration

### Deploying the task runner

**NOTE - If the task runner is already deployed (federalist-bucket-migrator-worker-production in production) or (federalist-bucket-migrator-worker-staging in staging) then it is not necessary to redeploy the task runner.  You can just start running tasks.**

```bash
# Migrating the staging sites
$ cf push -f manifest-staging.yml --health-check-type none --no-route

# Migrating the production sites
$ cf push -f manifest.yml --health-check-type none --no-route
```

### Getting a list of sites that should be migrated

```bash
# SSH into the task runner
$ cf ssh federalist-bucket-migrator-worker-staging

# Query the list of sites needed to be migrated
$ /app/migrate-site-bucket.sh getsites
```

### Starting a task to run a site migration

**Note: Tasks will run asynchronously in the background so you are able to start and run multiple tasks concurrently**

```bash
# Running the tasks in staging example
## NOTE - Make sure to remove "https://" when adding the <[site | demo] domain> arguments
$ cf run-task federalist-bucket-migrator-worker-staging "/app/migrate-site-bucket.sh migrate <owner> <repo> [site domain] [demo domain]"
```


### Checking on task statuses

```bash
# Check on tasks
$ cf tasks federalist-bucket-migrator-worker-staging
```


## About

### DEPENDENCIES
- Cloud Foundry CLI (https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)
- CF Service Connect (https://github.com/18F/cf-service-connect#readme)
- PSQL (https://www.postgresql.org/docs/current/app-psql.html)
- AWS CLI (https://aws.amazon.com/cli/)
- JQ CLI (https://stedolan.github.io/jq/)


### CF Task Runner Dockerfile

All the dependencies come preinstalled with the script in the [Dockerfile](./Dockerfile).


## Running the script locally **(Not Recommended)**

This script migrates a site using the shared bucket into its own dedicated bucket

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
