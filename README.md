# Federalist
[![Build Status](https://travis-ci.org/18F/federalist.svg?ref=master)](https://travis-ci.org/18F/federalist)
[![Code Climate](https://codeclimate.com/github/18F/federalist/badges/gpa.svg)](https://codeclimate.com/github/18F/federalist)
[![Known Vulnerabilities](https://snyk.io/test/github/18F/federalist/badge.svg)](https://snyk.io/test/github/18F/federalist)

***Under active development. Everything is subject to change. Interested in talking to us? [Join our public chat room](https://chat.18f.gov/?channel=federalist-public).***

Federalist is a unified interface for publishing static government websites. It automates common tasks for integrating GitHub, [Prose](https://github.com/prose/prose), and Amazon Web Services to provide a simple way for developers to launch new websites or more easily manage existing ones.

## Getting started

To run the server, you'll need [Node.js](https://nodejs.org/download/). You'll also need [nvm](https://github.com/creationix/nvm).

### env variables

#### In Production

We have a few environment variables that the application uses.
In production, those variables are provided to the application either through the Cloud Foundry environment or through Cloud Foundry services.

To inspect the way the environment is provided to the application in production and staging, look at `manifest.yml` and `staging_manifest.yml` respectively.
To see how the application recieves those configurations, looks at `config/env/production.js`.

The following environment variables are set on the Cloud Foundry environment in the application manifest:

- `NODE_ENV`: The node environment where the app should run. When running in Cloud Foundry this should always be set to production, even for the staging environment
- `APP_ENV`: The application environment in which the app should run. Valid values are `production` and `staging`.
- `SAILS_LOG_LEVEL`: Sets the log level for sails.
- `NPM_CONFIG_PRODUCTION`: This should be set to true in Cloud Foundry to prevent NPM from installing dev dependencies
- `NODE_MODULES_CACHE`: This should be set to true in Cloud Foundry to prevent caching node modules since those are vendored by Federalist
- `APP_NAME`: The name of the Cloud Foundry application
- `APP_COMAIN`: The hostname where the application runs in Cloud Foundry

Secrets cannot be kept in the application manifest so they are provided by Cloud Foundy services.
The app expects the following user provided services to be provided:

- `federalist-<environment<-redis`: A cloud.gov brokered service that allows the application to use redis for its session store
- `federalist-<environment>-rds`: A cloud.gov brokered service that allows the application to use RDS Postgres for its database
- `federalist-<environment>-s3`: A cloud.gov brokered service that allows the application to work with the S3 bucket where Federalist's sites live
- `federalist-<environment>-env`: A user-provided service that provides the application with secrets that cannot be added to `manifest.yml` b/c that file is under version control; this service provides the following:
  - `FEDERALIST_AWS_BUILD_KEY`: The AWS access key federalist uses to communicate with SQS
  - `FEDERALIST_AWS_BUILD_SECRET`: The AWS secret key federalist uses to communicate with SQS
  - `FEDERALIST_BUILD_CALLBACK`: The URL to which build containers should callback to with updates on their status
  - `FEDERALIST_BUILD_TOKEN`: The token that is used to authenticate build container callbacks
  - `FEDERALIST_SESSION_SECRET`: The session secret used to sign entries in Federalist's session store
  - `FEDERALIST_SQS_QUEUE`: The URL for the SQS queue that Federalist uses to communicate with federalist-builder
  - `GITHUB_CALLBACK_URL`: The callback URL used for GitHub authentication
  - `GITHUB_CLIENT_ID`: The client ID used for GitHub authentication
  - `GITHUB_CLIENT_SECRET`: The client secret used for GitHub authentication
  - `GITHUB_WEBHOOK_SECRET`: The secret used to sign and verify webhook requests from GitHub
  - `GITHUB_WEBHOOK_URL`: The url where GitHub webhook requests should be sent
  - `NEW_RELIC_APP_NAME`: The app name to report to New Relic
  - `NEW_RELIC_LICENSE_KEY`: The license key to use with New Relic

Here `<environment>` refers the value set for the `APP_ENV` environment variable.

#### In Development

In development, the application environment is configured within the `config/local.js`.
There a sample of that file at `config/local.sample.js` which can be copied over and configured.
This file's usage is discussed in length in "Building the Server" below.

### Build the server

* Download or Clone this repository from Github either by using the command line or repo's website on Github. On the right side of the repo's page, there is a button that states "Clone in Desktop".
*
* Run `nvm use` to ensure you are using the correct version of node
* Run `npm install` from the root(the directory that houses the projects files on your computer) of the repository to load modules and install Jekyll dependencies

Together these commands will looks something like the following:

```
$ git clone git@github.com:18F/federalist.git
$ cd federalist
$ nvm use
$ npm install
```

* Copy `config/local.sample.js` to `config/local.js`.

```
$ cp config/local.sample.js config/local.js
```

* Set up [an application on GitHub](https://github.com/settings/applications/new). You'll want to use `http://localhost:1337/auth` as the "Authorization callback url". Once you have created the application, you'll see a Client ID and Client Secret. Add these values to `config/local.js`.

```
passport: {
  github: {
    options: {
      clientID: '<<use the value from Github here>>',
      clientSecret: '<<use the value from Github here>>',
      callbackURL: 'http://localhost:1337/auth/github/callback'
    }
  }
}
```

In the end, your `local.js` file should look something like this:

```
module.exports = {
  passport: {
    github: {
      options: {
        clientID: 'abcdef123456',
        clientSecret: 'aabbccddeeff112233445566',
        callbackURL: 'http://localhost:1337/auth/github/callback'
      }
    }
  }
};
```

* Federalist grants access according to the organizations a user is a part of. Find your organization's ID by visiting `https://api.github.com/orgs/<your-org-name>` and copying the `id` into the whitelist of `organizations` in `config/local.js`, for example:

```
organizations: [
  6233994,  // 18f
  14109682, // federalist-users
  14080592,  // us-federal-sbst
  99999999 // your org added here
]
```
* Connect to the SQS build queue

In development, Federalist uses the staging build queue.
To connect to the build queue, get the credentials for the staging build queue and add them to the SQS config in your `config/local.js`.

Note that the values shown in the examples below are meant to serve only as an example.
You will need to look at the staging environment to fetch the actual values.

```
sqs: {
  accessKeyId: "ABC123",
  secretAccessKey: "456DEF",
  region: "us-est-1",
  queue: "https://sqs.us-east-1.amazonaws.com/789/ghi",
}
```

* Connect to the S3 bucket

In development, Federalist uses the staging S3 bucket.
To connect to the bucket, get the credentials for the staging bucket and add them to the S3 config in your `config/local.js`.

Note that the values shown in the examples below are meant to serve only as an example.
You will need to look at the staging environment to fetch the actual values.

```
s3: {
  accessKeyId: "ABC123",
  secretAccessKey: "456def",
  region: "us-gov-west-1",
  bucket: "789ghi",
}
```

* Run the server with `npm start` (You can use `npm run watch:server` for the server to restart when you save file changes and `npm run watch:client` to rebuild front-end files on each save) at the directory of the project on your local computer.

#### Build the server and the front-end

There are really two applications in one repo here. Right now we're OK with that because we're moving quick to get done with the prototypal phase of the project.

If you are working on the front-end of the application, the things you need to know are:

0. It is a React based application
0. It is built with `browserify` and uses `watchify` to build on changes
0. It lives in `/assets/app`

You can use `npm run watch` to get the project built and running. This will set up `watchify` to run when front end files change and will set up the server to reload on any file change (front end included)

#### Using Postgres

By default, the application should use local disk storage in place of a database. This is easier to get started and isn't a problem for local development. In production, the app uses Postgres as the data store. To use Postgres in your local dev environment:

0. First, you'll need to [install Postgres](http://www.postgresql.org/download/).
0. Next, you'll have to create the `federalist` database for the application. `$ createdb federalist` should do the trick
0. Add postgres to your `/config/local.js` file

```
connections: {
  postgres: {
    adapter: 'sails-postgresql',
    database: 'federalist'
  }
},
models: {
  connection: 'postgres'
}
```

## Architecture

This application is primarily a JSON API server based on the [Sails.js](http://sailsjs.org/) framework. It handles authentication, managing users, sites, and builds, and receives webhook requests from GitHub.

It automatically applies a webhook to the repository new sites and creates a new build on validated webhook requests.

The front end of the application is a [React](https://facebook.github.io/react/) based application, that uses [browserify](http://www.browserify.org) in the build process. It is a very lightweight consumer of the Sails API.

### Proof of concept

The proof of concept application will have a web-based front-end to interface with the API and allow users to add new sites, configure them, and open them in Prose for editing.

It will also route requests to the published static websites, including preview sites for each branch.

### Future goals

After the initial proof of concept, development will focus on scalability by moving to the AWS platform, using S3 for publishing, SQS for managing the publishing queue, and running publishing tasks on separate servers.

Additional development will focus on improved collaboration features, such as built-in support for forking and merging branches for drafts of changes, and automatic configuration of Prose settings.

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
