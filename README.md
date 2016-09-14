# Federalist
[![Build Status](https://travis-ci.org/18F/federalist.svg?ref=master)](https://travis-ci.org/18F/federalist)
[![Code Climate](https://codeclimate.com/github/18F/federalist/badges/gpa.svg)](https://codeclimate.com/github/18F/federalist)

***Under active development. Everything is subject to change. Interested in talking to us? [Join our public chat room](https://chat.18f.gov/?channel=federalist-public).***

Federalist is a unified interface for publishing static government websites. It automates common tasks for integrating GitHub, [Prose](https://github.com/prose/prose), and Amazon Web Services to provide a simple way for developers to launch new websites or more easily manage existing ones.

## Getting started

To run the server, you'll need [Node.js](https://nodejs.org/download/) and [Ruby](https://www.ruby-lang.org/en/documentation/installation/) installed. The setup process will automatically install Jekyll and its dependencies based on the `github-pages` gem.
You'll also need [nvm](https://github.com/creationix/nvm).
To build sites using Hugo, install [Hugo](http://gohugo.io/overview/installing/) and make sure it's available in your path.




### env variables

We have a few environment variables that the application uses, here is a list of the environment variables that the application will use if present:

* `FEDERALIST_AWS_BUILD_KEY` - the AWS key for container builds
* `FEDERALIST_AWS_BUILD_SECRET` - the AWS secret for container builds
* `FEDERALIST_BUILD_CALLBACK` - the endpoint for build status, defaults to 'http://localhost:1337/build/status/'. **This URL *must* include the trailing slash**
* `FEDERALIST_BUILD_ENGINE` - the build engine to use, defaults to 'buildengine'
* `FEDERALIST_BUILD_TOKEN` - random token used to protect the build status endpoint
* `FEDERALIST_CACHE_CONTROL` - 'max-age=60'
* `FEDERALIST_PUBLISH_DIR` - where to publish files if not S3, defaults to './assets'
* `FEDERALIST_S3_BUCKET` - bucket ID to push files to on S3
* `FEDERALIST_SQS_QUEUE` - the name of an SQS queue. If defined, Federalist will send build messages to this queue and expect an external build service
* `FEDERALIST_TEMP_DIR` - where files will be temporarily built, defaults to './.tmp'
* `FEDERALIST_TEST_ORG` - A github org to authorize the test user against
* `FEDERALIST_TEST_PASSWORD` **required for tests** - A github user password to run the tests with
* `FEDERALIST_TEST_USER` **required for tests** - A github user to run the tests with

* `GITHUB_CLIENT_CALLBACK_URL` - for dev you'll probably want to use http://localhost:1337/auth/github/callback
* `GITHUB_CLIENT_ID` **required** - get this when you register your app with Github
* `GITHUB_CLIENT_SECRET` **required** - you'll also get this when you register your app
* `GITHUB_TOKEN` - A GitHub oauth token that will be used in place of authentication
* `GITHUB_WEBHOOK_SECRET` - random token used to protect webhook messages, defaults to 'testingSecret'
* `GITHUB_WEBHOOK_URL` - should be full url, defaults to  'http://localhost:1337/webhook/github'

* `NEW_RELIC_APP_NAME` - application name to report to New Relic
* `NEW_RELIC_LICENSE_KEY` - license key for New Relic

* `NODE_ENV` - Node.js environment setting, defaults to 'development'
* `PORT` - Server port, defaults to  1337

* `SAILS_LOG_LEVEL` - Log level, defaults to 'info'

You'll notice that we talk about a `/config/local.js` file below, particularly for setting up the Github app information. For local development either approach is fine, but for production environments you'll want to set these env vars instead of committing `local.js` to your git history.


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

    $ cp config/local.sample.js config/local.js

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

* Run the server with `npm start` (You can use `npm run watch:server` for the server to restart when you save file changes and `npm run watch:client` to rebuild front-end files on each save) at the directory of the project on your local computer.


#### Build the server and the front-end
There are really two applications in one repo here. Right now we're OK with that because we're moving quick to get done with the prototypal phase of the project.

If you are working on the front-end of the application, the things you need to know are:

0. It is a Backbone based application
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

#### Integration tests

To run the integration tests you'll need:

- [Selenium](http://www.seleniumhq.org/) (and [Java](http://www.oracle.com/technetwork/java/javase/downloads/index.html)).
- [chromedriver](https://sites.google.com/a/chromium.org/chromedriver/)

##### Installing all of that and getting it running

We're going to use `selenium-standalone` to make installing all of those tools
just a bit easier to manage and install and we have some `npm` scripts to help
out.

    $ npm run test:selenium:install
    $ npm run test:selenium:start

Make sure to run both of these commands, and install Java if it asks you to do so.
It is required for selenium. After the second command is run successfully you
should see something like

    09:47:12.342 INFO - Selenium Server is up and running
    Selenium started

##### Setting up the test Github user

The integration tests rely on a test Github user to ensure that data is
appropriately displayed in the application. You can use any Github user, but
18F uses [@FederalistTestingUser](https://github.com/FederalistTestingUser).

First you need to give your app permission to access the user's data, but that
is not part of the integration test at this time. Thus, you should do this just
the first time you are setting up a new Github application.

Ensure that you have a Federalist application running (locally is fine). Open
an Incognito browser window and login to Github.com with your test user. If you
are on the 18F team, please ask in the Slack room for the test user credentials.

Once you have logged into Github, open your application
([http://127.0.0.1:1337](http://127.0.0.1:1337) if you're running locally) and
login. You should grant the application permission to access the test user's
data in the OAuth authorization view.

Now that your application can access Github on behalf of the test user, set the
environment variables for the integration tests.

    $ export FEDERALIST_TEST_USER=<test user>
    $ export FEDERALIST_TEST_PASSWORD=<test user password>

And now you can run the tests:

    $ npm run test:integration


##### Running against Sauce Labs

Sauce Labs can be a bit flakey sometimes and failures on Travis might not be
reproducible locally. If you're just looking for details of the last Travis run,
ping the [account holder for
access](https://github.com/18F/federalist/blob/523aceb9885f248dd60189f9c13c834c3ba0947e/.travis.yml#L24).
Otherwise, 18F personnel can request a Sauce Labs account in Slack.

Once you have an account, you'll need your access key. It's available in the
Sauce Labs account settings and looks like a GUID e.g.
`abcdef78-1234-1234-1234-abcdef789012`.

    $ export SAUCE_USERNAME=<username> SAUCE_ACCESS_KEY=<sauce access key>

Use [Sauce
Connect](https://wiki.saucelabs.com/display/DOCS/Setting+Up+Sauce+Connect) to
open a tunnel between your localhost and Sauce Labs (because your dev server is
running on localhost).

    $ brew install sauce-connect
    $ sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY &

Then run your tests.

    $ SAUCE_USERNAME=$SAUCE_USERNAME SAUCE_ACCESS_KEY=$SAUCE_ACCESS_KEY npm run test:integration

You shouldn't see Chrome launch locally because the tests are launched in on
a Sauce Labs VM. Instead, you can watch the tests run live through the Sauce
Labs UI.

_Note: the environment variable names are important here because these are what
webdriverio will be looking for._


## Architecture

This application is primarily a JSON API server based on the [Sails.js](http://sailsjs.org/) framework. It handles authentication, managing users, sites, and builds, and receives webhook requests from GitHub.

It automatically applies a webhook to the repository new sites and creates a new build on validated webhook requests.

The front end of the application is a [Backbone](http://backbonejs.org) based application, that uses [browserify](http://www.browserify.org) in the build process. It is a very lightweight consumer of the Sails API.

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
