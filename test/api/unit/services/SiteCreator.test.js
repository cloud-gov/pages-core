const crypto = require("crypto")
const expect = require("chai").expect
const nock = require("nock")
const factory = require("../../support/factory")
const githubAPINocks = require("../../support/githubAPINocks")
const SiteCreator = require("../../../../api/services/SiteCreator")
const { Build, Site, User } = require("../../../../api/models")

describe("SiteCreator", () => {
  describe(".createSite({ siteParams, user })", () => {
    context("when the site does not exist in Federalist", () => {
      it("should create a new site record for the given repository and add the user", done => {
        let user
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
        }

        factory.user().then(model => {
          user = model
          githubAPINocks.repo()
          githubAPINocks.webhook()
          return SiteCreator.createSite({ user, siteParams })
        }).then(site => {
          expect(site).to.not.be.undefined
          expect(site.owner).to.equal(siteParams.owner)
          expect(site.repository).to.equal(siteParams.repository)

          return Site.findOne({
            where: {
              owner: siteParams.owner,
              repository: siteParams.repository
            },
            include: [ User ],
          })
        }).then(site => {
          expect(site).to.not.be.undefined
          expect(site.Users).to.have.length(1)
          expect(site.Users[0].id).to.equal(user.id)
          done()
        }).catch(done)
      })

      it("should trigger a build for the new site", done => {
        let user
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
        }

        factory.user().then(model => {
          user = model
          githubAPINocks.repo()
          githubAPINocks.webhook()
          return SiteCreator.createSite({ user, siteParams })
        }).then(() => {
          return Site.findOne({
            where: {
              owner: siteParams.owner,
              repository: siteParams.repository
            },
            include: [ Build ]
          })
        }).then(site => {
          expect(site.Builds).to.have.length(1)
          expect(site.Builds[0].user).to.equal(user.id)
          done()
        }).catch(done)
      })

      it("should create a webhook for the new site", done => {
        let webhookNock
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
        }

        factory.user().then(user => {
          githubAPINocks.repo()
          webhookNock = githubAPINocks.webhook({
            accessToken: user.githubAccessToken,
            owner: siteParams.owner,
            repo: siteParams.repository,
          })

          return SiteCreator.createSite({ user, siteParams })
        }).then(() => {
          expect(webhookNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })

      it("should reject if the user does not have write access to the site", done => {
        let repoNock
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
        }

        factory.user().then(user => {
          repoNock = githubAPINocks.repo({
            accessToken: user.accessToken,
            owner: siteParams.owner,
            repo: siteParams.repository,
            response: [200, { permissions: {
              push: false,
            }}],
          })
          return SiteCreator.createSite({ user, siteParams })
        }).catch(err => {
          expect(err.status).to.equal(400)
          expect(err.message).to.equal("You do not have write access to this repository")
          done()
        })
      })
    })

    context("when the site exists in Federalist", () => {
      it("should not create a new site record", done => {
        let site
        let sitePromise = factory.site()
        let userPromise = factory.user()

        Promise.props({ site: sitePromise, user: userPromise }).then(models => {
          site = models.site
          githubAPINocks.repo()
          return SiteCreator.createSite({ user: models.user, siteParams: {
            owner: site.owner,
            repository: site.repository,
          }})
        }).then(createdSite => {
          expect(createdSite.id).to.equal(site.id)

          return Site.findAll({
            where: {
              owner: site.owner,
              repository: site.repository
            },
          })
        }).then(sites => {
          expect(sites).to.have.length(1)
          done()
        }).catch(done)
      })

      it("should not trigger a build for the existing site", done => {
        let site, user
        let sitePromise = factory.site()
        let userPromise = factory.user()

        Promise.props({ site: sitePromise, user: userPromise }).then(models => {
          site = models.site
          user = models.user
          githubAPINocks.repo()
          return SiteCreator.createSite({ user, siteParams: {
            owner: site.owner,
            repository: site.repository,
          }})
        }).then(() => {
          return Site.findById(site.id, { include: [ Build ]})
        }).then(site => {
          expect(site.Builds).to.have.length(0)
          done()
        }).catch(done)
      })

      it("should add the user to the existing site", done => {
        let site, user
        let sitePromise = factory.site()
        let userPromise = factory.user()

        Promise.props({ site: sitePromise, user: userPromise }).then(models => {
          site = models.site
          user = models.user
          githubAPINocks.repo()
          return SiteCreator.createSite({ user, siteParams: {
            owner: site.owner,
            repository: site.repository,
          }})
        }).then(() => {
          return Site.findById(site.id, { include: [ User ]})
        }).then(site => {
          const addedUser = site.Users.find((candidate) => {
            return candidate.id === user.id
          })
          expect(addedUser).to.not.be.undefined
          done()
        }).catch(done)
      })

      it("should not attempt to add a webhook for the site", done => {
        let webhookNock
        const site = factory.site()
        const user = factory.user()

        Promise.props({ user, site }).then(({ user, site }) => {
          githubAPINocks.repo()
          webhookNock = githubAPINocks.webhook()
          return SiteCreator.createSite({ user, siteParams: {
            owner: site.owner,
            repository: site.repository,
          }})
        }).then(() => {
          expect(webhookNock.isDone()).to.equal(false)
          nock.cleanAll()
          done()
        }).catch(done)
      })

      it("should reject if the user does not have write access to the site", done => {
        const user = factory.user()
        const site = factory.site()

        Promise.props({ user, site }).then(({ user, site }) => {
          githubAPINocks.repo({
            accessToken: user.accessToken,
            owner: site.owner,
            repo: site.repository,
            response: [200, { permissions: {
              push: false,
            }}],
          })
          return SiteCreator.createSite({ user, siteParams: {
            owner: site.owner,
            repository: site.repository,
          }})
        }).catch(err => {
          expect(err.status).to.equal(400)
          expect(err.message).to.equal("You do not have write access to this repository")
          done()
        }).catch(done)
      })

      it("should reject if the user has already added the site", done => {
        const user = factory.user()
        const site = factory.site({ users: Promise.all([user]) })

        Promise.props({ user, site }).then(({ user, site }) => {
          githubAPINocks.repo()
          return SiteCreator.createSite({ user, siteParams: {
            owner: site.owner,
            repository: site.repository,
          }})
        }).catch(err => {
          expect(err.status).to.equal(400)
          expect(err.message).to.equal("You've already added this site to Federalist")
          done()
        }).catch(done)
      })
    })

    context("when the site is created from a template", () => {
      it("should create a new site record for the given repository and add the user", done => {
        let user
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
          template: "microsite",
        }

        factory.user().then(model => {
          user = model
          githubAPINocks.createRepoForOrg()
          githubAPINocks.webhook()
          return SiteCreator.createSite({ user, siteParams })
        }).then(site => {
          expect(site).to.not.be.undefined
          expect(site.owner).to.equal(siteParams.owner)
          expect(site.repository).to.equal(siteParams.repository)

          return Site.findOne({
            where: {
              owner: siteParams.owner,
              repository: siteParams.repository
            },
            include: [ User ],
          })
        }).then(site => {
          expect(site).to.not.be.undefined
          expect(site.Users).to.have.length(1)
          expect(site.Users[0].id).to.equal(user.id)
          done()
        }).catch(done)
      })

      it("should use jekyll as the build engine", done => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
          template: "microsite",
        }

        factory.user().then(user => {
          githubAPINocks.createRepoForOrg()
          githubAPINocks.webhook()
          return SiteCreator.createSite({ siteParams, user })
        }).then(site => {
          expect(site.engine).to.equal("jekyll")
          done()
        }).catch(done)
      })

      it("should trigger a build that pushes the source repo to the destiantion repo", done => {
        let user
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
          template: "microsite",
        }

        factory.user().then(model => {
          user = model
          githubAPINocks.createRepoForOrg()
          githubAPINocks.webhook()
          return SiteCreator.createSite({ siteParams, user })
        }).then(site => {
          return Site.findById(site.id, { include: [ Build ] })
        }).then(site => {
          expect(site.Builds).to.have.length(1)
          expect(site.Builds[0].user).to.equal(user.id)
          expect(site.Builds[0].source).to.deep.equal({
            repository: "microsite-template",
            owner: "USG-Website-Templates",
          })
          done()
        }).catch(done)
      })

      it("should create a webhook for the new site", done => {
        let webhookNock
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
          template: "microsite",
        }

        factory.user().then(user => {
          githubAPINocks.createRepoForOrg()
          webhookNock = githubAPINocks.webhook({
            accessToken: user.githubAccessToken,
            owner: siteParams.owner,
            repo: siteParams.repository,
          })
          return SiteCreator.createSite({ user, siteParams })
        }).then(() => {
          expect(webhookNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })

      it("should reject if the repo already exists on GitHub", done => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString("hex"),
          repository: crypto.randomBytes(3).toString("hex"),
          template: "microsite",
        }

        factory.user().then(user => {
          githubAPINocks.createRepoForOrg({
            accessToken: user.accessToken,
            org: siteParams.owner,
            repo: siteParams.repository,
            response: [422, {
              "errors": [{ "message":"name already exists on this account" }]
            }]
          })
          return SiteCreator.createSite({ user, siteParams })
        }).catch(err => {
          expect(err.status).to.equal(400)
          expect(err.message).to.equal("A repo with that name already exists.")
          done()
        }).catch(done)
      })
    })
  })
})
