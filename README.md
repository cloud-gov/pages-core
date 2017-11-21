# Federalist

[![CircleCI](https://circleci.com/gh/18F/federalist.svg?style=svg)](https://circleci.com/gh/18F/federalist)
[![Code Climate](https://codeclimate.com/github/18F/federalist/badges/gpa.svg)](https://codeclimate.com/github/18F/federalist)
[![Test Coverage](https://codeclimate.com/github/18F/federalist/badges/coverage.svg)](https://codeclimate.com/github/18F/federalist/coverage)
[![Dependency Status](https://gemnasium.com/badges/github.com/18F/federalist.svg)](https://gemnasium.com/github.com/18F/federalist)

***Under active development. Everything is subject to change. Learn more at the [documentation site](https://federalist-docs.18f.gov/). Interested in talking to us? [Join our public chat room](https://chat.18f.gov/).***

Federalist is a unified interface for publishing static government websites. It automates common tasks for integrating GitHub and Amazon Web Services to provide a simple way for developers to launch new static websites or more easily manage existing static websites. This repo is home to "federalist-core" - a Node.js app that allows government users to add and configure their Federalist sites.

## Getting started

### Dependencies / Tooling
Before you start, ensure you have the following installed:

- [node](https://nodejs.org/en/download/package-manager/#osx)
- [nvm](https://github.com/creationix/nvm#installation) or [n](https://github.com/tj/n#installation)
- [yarn](https://yarnpkg.com/)
- [Postgres](https://www.postgresql.org/)
- [Cloud Foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)


### Running locally (development)

1. Download or clone the `18F/federalist` repository from Github and `cd` to that directory.
1. Run `nvm use` to ensure you are using the correct version of node.
1. Run `yarn` to load modules and install Jekyll dependencies.
1. Make a copy of `config/local.sample.js` and name it `local.js` and place it in the `config` folder.
This will be the file that holds your S3 and SQS configurations.
1. [Register a new OAuth application on GitHub](https://github.com/settings/applications/new). You'll want to use `http://localhost:1337/auth` as the "Authorization callback url". Once you have created the application, you'll see a `Client ID` and `Client Secret`. Add these values to `config/local.js`.
    ```js
    passport: {
      github: {
        options: {
          clientID: 'VALUE FROM GITHUB',
          clientSecret: 'VALUE FROM GITHUB',
          callbackURL: 'http://localhost:1337/auth/github/callback'
        }
      }
    }
    ```
1. [Register or create a new GitHub organization](https://github.com/settings/organizations). Find your organization's ID by visiting `https://api.github.com/orgs/<your-org-name>` and copying the `id` into the whitelist of `organizations` in `config/local.js`.
    ```js
    organizations: [
      99999999 // your org added here
    ]
    ```
1. Type `cf login --sso -a https://api.fr.cloud.gov -o gsa-18f-federalist -s staging` in terminal.
1. Visit https://login.fr.cloud.gov/passcode to get a one time passcode.
1. Enter your passcode back into terminal.
1. Type `cf apps`.
1. Type `cf env federalist-staging` to get environment variables.
1. Find the section in the listing of environment variables that starts with `"s3": [` and look for the following values and paste those values into the S3 section in your `local.js` file.
    - `access_key_id`
    - `bucket`
    - `secret_access_key`
1. Find the section in the listing of environment variables for SQS and look for the following values and paste those values into the SQS section in your `local.js` file.
    - `FEDERALIST_AWS_BUILD_KEY` is `accessKeyId`
    - `FEDERALIST_SESSION_SECRET` is `secreyAccessKey`
    - `FEDERALIST_SQS_QUEUE` is `queue`
1. Create Postgres databases by running
    - Run `createdb federalist`
    - Run `createdb federalist-test`
1. Great work! The Federalist app is now ready to run locally! :tada:
    - Run `yarn`
    - Run `yarn build`
    - Run `yarn start`
1. You should now be able to see Federalist running at http://localhost:1337/

**Pro tips:**
- You can use `yarn watch` to automatically restart the server and rebuild front end assets on file change, which is useful for development.
- You can use `yarn test` to run local testing on the app.


#### Build the server and the front-end

If you are working on the front-end of the application, the things you need to know are:

1. It is a React based application
1. It is built with `webpack`
1. It lives in `/frontend`

To analyze the contents of the front end JavaScript bundle, use `yarn analyze-webpack` after a build. This will launch a browser window showing a visualization of all the code that makes up the bundle.

### Environment variables

#### In Production

We have a few environment variables that the application uses.
In production, those variables are provided to the application either through the Cloud Foundry environment or through Cloud Foundry services.

To inspect the way the environment is provided to the application in production and staging, look at `manifest.yml` and `staging_manifest.yml` respectively.
To see how the application receives those configurations, looks at `config/env/production.js`.

The following environment variables are set on the Cloud Foundry environment in the application manifest:

- `NODE_ENV`: The node environment where the app should run. When running in Cloud Foundry this should always be set to production, even for the staging environment
- `APP_ENV`: The application environment in which the app should run. Valid values are `production` and `staging`.
- `LOG_LEVEL`: Sets the log level for the app.
- `NPM_CONFIG_PRODUCTION`: This should be set to true in Cloud Foundry to prevent Yarn/NPM from installing dev dependencies
- `NODE_MODULES_CACHE`: This should be set to true in Cloud Foundry to prevent caching node modules since those are vendored by Federalist
- `APP_NAME`: The name of the Cloud Foundry application
- `APP_COMAIN`: The hostname where the application runs in Cloud Foundry

Secrets cannot be kept in the application manifest so they are provided by Cloud Foundry services.
The app expects the following user provided services to be provided:

- `federalist-<environment>-redis`: A cloud.gov brokered service that allows the application to use redis for its session store
- `federalist-<environment>-rds`: A cloud.gov brokered service that allows the application to use RDS Postgres for its database
- `federalist-<environment>-s3`: A cloud.gov brokered service that allows the application to work with the S3 bucket where Federalist's sites live
- `federalist-<environment>-env`: A user-provided service that provides the application with secrets that cannot be added to `manifest.yml` b/c that file is under version control; this service provides the following:
  - `FEDERALIST_AWS_BUILD_KEY`: The AWS access key federalist uses to communicate with SQS
  - `FEDERALIST_AWS_BUILD_SECRET`: The AWS secret key federalist uses to communicate with SQS
  - `FEDERALIST_BUILD_CALLBACK`: The URL to which build containers should callback to with updates on their status
  - `FEDERALIST_SESSION_SECRET`: The session secret used to sign entries in Federalist's session store
  - `FEDERALIST_SQS_QUEUE`: The URL for the SQS queue that Federalist uses to communicate with federalist-builder
  - `FEDERALIST_SQS_REGION`: The AWS region for the SQS queue that Federalist uses to communicate with federalist-builder
  - `GITHUB_CALLBACK_URL`: The callback URL used for GitHub authentication
  - `GITHUB_CLIENT_ID`: The client ID used for GitHub authentication
  - `GITHUB_CLIENT_SECRET`: The client secret used for GitHub authentication
  - `GITHUB_WEBHOOK_SECRET`: The secret used to sign and verify webhook requests from GitHub
  - `GITHUB_WEBHOOK_URL`: The url where GitHub webhook requests should be sent
  - `NEW_RELIC_APP_NAME`: The app name to report to New Relic
  - `NEW_RELIC_LICENSE_KEY`: The license key to use with New Relic

Here `<environment>` refers the value set for the `APP_ENV` environment variable.

#### Using Postgres

By default, the application should use local disk storage in place of a database. This is easier to get started and isn't a problem for local development. In production, the app uses Postgres as the data store. To use Postgres in your local dev environment:

0. First, you'll need to [install Postgres](http://www.postgresql.org/download/).
0. Next, you'll have to create the `federalist` database for the application. `$ createdb federalist` should do the trick. If you wish to run the tests, do the same, but for a database named `federalist-test`.
0. Add postgres to your `/config/local.js` file

```js
connections: {
  postgres: {
    database: 'federalist'
  }
},
models: {
  connection: 'postgres'
}
```

### Testing and linting

When making code changes, be sure to write new or modify existing tests to cover your changes.

The full test suite of both front and back end tests can be run via:

```sh
yarn test
```

You can also just run back or front end tests via:

```sh
yarn test:server  # for back end tests
yarn test:client  # for front end tests
yarn test:client:watch  # to watch and re-run front end tests
```

To lint the files you have changed (with `eslint`), run:

```sh
yarn lint:diff
```

For the full list of available commands that you can run with `yarn` or `npm`, see the `"scripts"` section of `package.json`.

## Initial proposal

Federalist is new open source publishing system based on proven open source components and techniques. Once the text has been written, images uploaded, and a page is published, the outward-facing site will act like a simple web site -- fast, reliable, and easily scalable. Administrative tools, which require authentication and additional interactive components, can be responsive with far fewer users.

Regardless of the system generating the content, all websites benefit from the shared editor and static hosting, which alleviates the most expensive requirements of traditional CMS-based websites and enables shared hosting for modern web applications.

From a technical perspective, a modern web publishing platform should follow the “small pieces loosely joined” API-driven approach. Three distinct functions operate together under a unified user interface:

1. **Look & feel of the website**
Templates for common use-cases like a departmental website, a single page report site, API / developer documentation, project dashboard, and internal collaboration hub can be developed and shared as open source repositories on GitHub. Agencies wishing to use a template simply create a cloned copy of the template, add their own content, and modify it to suit their needs. Social, analytics, and accessibility components will all be baked in, so all templates are in compliance with the guidelines put forth by SocialGov and Section 508.

2. **Content editing**
Content editing should be a separate application rather than built into the web server. This allows the same editing interface to be used across projects. The editing interface only needs to scale to match the load from *editors*, not *visitors*.

3. **Publishing infrastructure**
Our solution is to provide scalable, fast, and affordable static hosting for all websites. Using a website generator like Jekyll allows for these sites to be built dynamically and served statically.

## Related reading

- [18F Blog Post on Federalist's platform launch](https://18f.gsa.gov/2015/09/15/federalist-platform-launch/)
- [Building CMS-Free Websites](https://developmentseed.org/blog/2012/07/27/build-cms-free-websites/)
- [Background on relaunch of Healthcare.gov’s front-end](http://www.theatlantic.com/technology/archive/2013/06/healthcaregov-code-developed-by-the-people-and-for-the-people-released-back-to-the-people/277295/)
- [HealthCare.gov uses lightweight open source tools](https://www.digitalgov.gov/2013/05/07/the-new-healthcare-gov-uses-a-lightweight-open-source-tool/)
- [A Few Notes on NotAlone.gov](https://18f.gsa.gov/2014/05/09/a-few-notes-on-notalone-gov/)

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
