# Federalist

***Under active development. Everything is subject to change.***

Federalist is a unified interface for publishing static government websites. It automates common tasks for integrating GitHub, [Prose](https://github.com/prose/prose), and Amazon Web Services to provide a simple way for developers to launch new websites or more easily manage existing ones.

This project will receive funding through GSA's Great Pitch, a "pilot program to support the exploration and testing of new, good-for-government product or service ideas that positively impact Citizen Experience, Smarter IT Delivery, Open Government, or Secure Cloud, which can prove their value by end of the fiscal year."

## Getting started

To run the server, you'll need Node.js and Ruby installed. The setup process will automatically install Jekyll and its dependencies based on the `github-pages` gem.

To build sites using Hugo, install [Hugo](http://gohugo.io/overview/installing/) and make sure it's available in your path.

### Build the server

* Download or clone this repository
* Run `npm install` from the root of the repository to load modules and install Jekyll dependencies

Together these commands will looks something like the following:

```
$ git clone git@github.com:18F/federalist.git
$ cd federalist
$ npm install
```

* Set up [an application on GitHub](https://github.com/settings/applications/new). You'll want to use `http://localhost:1337/auth` as the "Authorization callback url". Once you have created the application, you'll see a Client ID and Client Secret. Use those  values in `config/local.js`

 ```js
 passport: {
   github: {
     options: {
       clientID: '<<use the value from Github here>>',
       clientSecret: '<<085aac67e9ca3a58f91517244c1ba33762d093cb-ish>>'
     }
   }
 }
 ```
 
* Set webhook settings for a public endpoint and secret

  ```js
  webhook: {
    endpoint: 'https://Vncr0qo2Yx.ngrok.io/webhook/github',
    secret: 'testSecret'
  }
  ```
* Run the server with `npm start` or `node app.js` (You can use `npm run watch` for the server to restart when you save file changes)

## Architecture

This application is primarily a JSON API server based on the [Sails.js](http://sailsjs.org/) framework. It handles authentication, managing users, sites, and builds, and receives webhook requests from GitHub.

It automatically applies a webhook to the repository new sites and creates a new build on validated webhook requests.

### Proof of concept

The proof of concept application will have a web-based front-end to interface with the API and allow users to add new sites, configure them, and open them in Prose for editing.

It will also route requests to the published static websites, including preview sites for each branch.

### Future goals

After the initial proof of concept, development will focus on scalability by moving to the AWS platform, using S3 for publishing, SQS for managing the publishing queue, and running publishing tasks on separate servers.

Additional development will focus on improved collaboration features, such as built-in support for forking and merging branches for drafts of changes, and automatic configuration of Prose settings.

## Great Pitch proposal

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

- [Building CMS-Free Websites](https://developmentseed.org/blog/2012/07/27/build-cms-free-websites/)
- [Background on relaunch of Healthcare.gov’s front-end](http://www.theatlantic.com/technology/archive/2013/06/healthcaregov-code-developed-by-the-people-and-for-the-people-released-back-to-the-people/277295/)
- [HealthCare.gov uses lightweight open source tools](https://www.digitalgov.gov/2013/05/07/the-new-healthcare-gov-uses-a-lightweight-open-source-tool/)
- [A Few Notes on NotAlone.gov](https://18f.gsa.gov/2014/05/09/a-few-notes-on-notalone-gov/)

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
