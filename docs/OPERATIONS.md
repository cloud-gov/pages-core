# Platform Operations

These are tips and functionalities available to run operations against the platform

## Scripts

The [`./scripts/`](./scripts/) directory is used for scripts to be run on the platform in any environment. These can be scripts run at adhoc by platform operators or scripts that are run in CI.

### Migrating a site's repository

Run this script if the site's Github repository needs to be moved to a new Github owner and/or repository name.

Requirements:

- `siteId`: The unique integer id of the site
- `email`: The user's UAA Identity email with the proper Github credentials to add webhooks to the new site repository
- `owner`: The new Github owner or organization name
- `repository`: The new Github repository name

Example:

```bash
## Running the site repo migration ##
# Task arguments:
#   --command Required: Runs migration command with args
#      ie: yarn migrate-site-repo <siteId> <email> <owner> <repository>
#   [--name] Optional: Name to give the task (generated if omitted)

## Example migration
$ cf run-task pages-<env> --command "yarn migrate-site-repo 1 user@agency.gov agency-org site-repo" --name site-1-migrate

## See the migration output
$ cf logs --recent pages-<env>
```

### Rotating site webhook secrets

Run this script if a new webhook secret is genereated for a source code platform and you want to update the related sites' webhooks.

__Update the pages-<env>-env credentials service:__

```bash
# Update the credentials service
cf uups pages-$ENV-env -p { <SOURCECODE_PLATFORM>_WEBHOOK_SECRET,...rest of the credentials}

# Restage app to pick updated creds
cf restage pages-$ENV --strategy rolling
```
_Read more about managing [user provided services](#user-provided-services)_

__Running the script from an app instance:__

```bash
# Run the web migrations script
# Get onto the app
cf ssh pages-$ENV

# Start up the runtime in the app with proper config
/tmp/lifecycle/launcher /home/vcap/app bash ''

# run the script
node ./scripts/update-webhooks.js <platform>
```

## Managing environment services

### User Provided Services

User provided services allow us to managage credentials for applications in each destinct environment. The service is attached to the app deployment in the `manifest.yml` and the services provide `credentials` for the app to consume. This allows the platform to also rotate credentials independently of the app deployment lifecyle. We can update the service's credentials and restage the related apps in their respective environments.

This is the list of user provided services the core platform is consuming:

|Service Name | Description|
|-------------|------------|
|`app-<env>-uaa-client`|OAuth credentials with Cloud.gov's UAA|
|`pages-<env>-env` |Third party config and secrets|
|`pages-<env>-proxy`|The Pages proxy app info|
|`pages-<env>-domain`|The Pages domain info|
|`federalist-deploy-user`|User info to run deployment tasks in our CF spaces|
|`mailer`|Email service info|
|`pages-<env>-encryption`|Platform encryption info|
|`federalist-<env>-uev-key`|User encryption info|


To create, update, and delete the user provided service credentials use the `cf` cli.

__Creating a user provided service:__
```bash
# Use json to create credentials
cf cups <service-name> -g '{ "KEY_1": "value", ...}'
```

__Updating a user provided service:__
```bash
# Make sure to pass all of the exsting credentials
# along with the updated or added credentials
cf uups <service-name> -p '{ "EXISTING_KEY_1": "value", "EXISTING_KEY_2": "updated value", "NEW_KEY": "value", ...}'

# Restage the app so it can get the new/updated keys
cf restage <app-name> --strategy rolling
```

__Deleting a user provided service:__

To delete a service the app will have to go through a full deploymet. Remove the service from the `manifest.yml`, create a new pull requst, and deploy through all of the environments.

Delete the service:
```bash
cf ds <service-name>
```

## Operations user

The platform uses a shared operations user to connect to Pages organizations and GitHub oauth token. This allows us to create organizations to support Pages Editor sites and pull the corresponding site template source code from GitHub. The account credentials are available in credhub under the `pages-operations-<env>` if you need to access Pages as the operations user.

## Dev and Staging

### Manually running migrations in dev or staging environments

It may necessary at some point to `migrate:down` or `:up` to explore something in the dev or staging environment, or to resolve an earlier failure.

This can be done by first doing a `cf login` and selecting the appropriate org and space.

Then, shell into the environment, e.g. `cf ssh pages-dev`.

From there:

```bash
$ /tmp/lifecycle/shell

$ node --env-file=.env ./ci/tasks/configure-database-migrations.js

## Example migrate down
$ node node_modules/.bin/db-migrate down --config database.json -e production
```

## CI

### Nightly site bucket key rotations

This is a CI task that runs nightly in order to rotate a subset of site bucket keys. The script selects __20__ sites based on the oldest `awsBucketKeyUpdatedAt` timestamps. A site's S3 service instance credentials are deleted and then regenerated. Any failures in the rotation will trigger a Slack notification.

Task name: `nightly-site-bucket-key-rotator`
Task script: [`rotate-bucket-keys.js`](./ci/tasks/rotate-bucket-keys.js)
Task partial: [`rotate-bucket-keys.yml`](./ci/partials/rotate-bucket-keys.yml)

## Querying

### Build metrics

It may be useful to query the database directly to identify sites that are outliers in build resource usage, or those which rely on engines close to the end of their lives. Here are some examples:

#### Find all builds consuming more than 2GB of disk space
```sql
SELECT build.id          AS "build id",
       build."createdAt" AS "build date",
       repository,
       owner,
       agency,
       to_char((metrics->'machine'->'disk')::numeric,'999G999G999G999') AS disk
FROM build, site, organization
WHERE site.id = build.site
  AND site."organizationId" = organization.id
  AND (metrics->'machine'->'disk')::numeric > 2000000000
ORDER BY metrics->'machine'->'disk' DESC;
```

#### Find all sites using Ruby 3.1, aggregating by site
```sql
SELECT site.id AS "site id",
       repository,
       organization.name AS "organization",
       agency
FROM site, organization, build
WHERE site.id = build.site
  AND site."organizationId" = organization.id
  AND metrics->'engines'->'ruby' IS NOT NULL
  AND metrics->'engines'->'ruby'->>'version' LIKE 'ruby 3.1%'
GROUP BY site.id, organization.name, agency;
```

#### Find all organization manager email addresses for sites using Node v18
```sql
SELECT uaa_identity.email AS "uaa email",
       site.id AS "site id",
       repository,
       organization.name AS "organization",
       organization.agency
FROM "user", organization_role, organization, role, uaa_identity, site, build
WHERE "user".id = organization_role."userId"
  AND organization.id = organization_role."organizationId"
  AND role.id = organization_role."roleId"
  AND role.name = 'manager'
  AND "user".id = uaa_identity."userId"
  AND site.id = build.site
  AND organization.id = site."organizationId"
  AND metrics->'engines'->'node' IS NOT NULL
  AND metrics->'engines'->'node'->>'version' LIKE 'v18%'
GROUP BY uaa_identity.email, site.id, organization.name, agency
ORDER BY uaa_identity.email, site.id;
```
