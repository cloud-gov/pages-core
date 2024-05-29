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
