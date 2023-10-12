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
$ cf run-task pages-<env> "yarn migrate-site-repo 1 user@agency.gov agency-org site-repo" --name site-1-migrate
```
