const expect = require("chai").expect
const factory = require("../../support/factory")
const githubAPINocks = require("../../support/githubAPINocks")

describe("GitHub", () => {
  describe(".checkPermissions(user, owner, repository)", () => {
    it("should resolve with the users permissions", done => {
      factory.user().then(user => {
        githubAPINocks.repo({
          accessToken: user.accessToken,
          owner: "repo-owner",
          repo: "repo-name",
          response: [200, { permissions: "Repo permissions" }],
        })

        return GitHub.checkPermissions(user, "repo-owner", "repo-name")
      }).then(permissions => {
        expect(permissions).to.equal("Repo permissions")
        done()
      }).catch(done)
    })

    it("should reject if the repository does not exist", done => {
      factory.user().then(user => {
        githubAPINocks.repo({
          accessToken: user.accessToken,
          owner: "repo-owner",
          repo: "repo-name",
          response: [404, { message: "Not Found" }],
        })

        return GitHub.checkPermissions(user, "repo-owner", "repo-name")
      }).catch(error => {
        expect(error).to.not.be.undefined
        done()
      }).catch(done)
    })
  })

  describe(".setWebhook(site, user)", () => {
    it("should set a webhook on the repository", done => {
      let site, user

      factory.user().then(model => {
        user = model
        return factory.site()
      }).then(model => {
        site = model
        githubAPINocks.webhook({
          accessToken: user.accessToken,
          owner: site.owner,
          repo: site.repository,
          response: 201
        })
        return GitHub.setWebhook(site, user.id)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should resolve if the webhook already exists", done => {
      let site, user

      factory.user().then(model => {
        user = model
        return factory.site()
      }).then(model => {
        site = model
        githubAPINocks.webhook({
          accessToken: user.accessToken,
          owner: site.owner,
          repo: site.repository,
          response: [400, {
            errors: [{ message: "Hook already exists on this repository" }]
          }]
        })
        return GitHub.setWebhook(site, user.id)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the user does not have admin access to the repository", done => {
      let site, user

      factory.user().then(model => {
        user = model
        return factory.site()
      }).then(model => {
        site = model
        githubAPINocks.webhook({
          accessToken: user.accessToken,
          owner: site.owner,
          repo: site.repository,
          response: [404, {
            message: "Not Found"
          }]
        })
        return GitHub.setWebhook(site, user.id)
      }).then(() => {
        throw new Error("Expected admin access error")
      }).catch(err => {
        expect(err.status).to.equal(400)
        expect(err.message).to.equal("You do not have admin access to this repository")
        done()
      }).catch(done)
    })
  })

  describe(".validateUser(accessToken)", () => {
    it("should resolve if the user is on a whitelisted team", done => {
      githubAPINocks.userOrganizations({
        accessToken: "123abc",
        organizations: [{ id: sails.config.passport.github.organizations[0] }],
      })

      GitHub.validateUser("123abc").then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the user is not on a whitelisted team", done => {
      const FAKE_INVALID_ORG_ID = 4598345

      githubAPINocks.userOrganizations({
        accessToken: "123abc",
        organizations: [{ id: FAKE_INVALID_ORG_ID }],
      })

      GitHub.validateUser("123abc").catch(err => {
        expect(err.message).to.equal("Unauthorized")
        done()
      })
    })

    it("should reject if access token is not a valid GitHub access token", done => {
      const FAKE_INVALID_ORG_ID = 4598345

      githubAPINocks.userOrganizations({
        accessToken: "123abc",
        response: 403,
      })

      GitHub.validateUser("123abc").catch(err => {
        done()
      })
    })
  })
})
