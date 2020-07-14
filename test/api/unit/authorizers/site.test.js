const crypto = require("crypto")
const expect = require("chai").expect
const factory = require("../../support/factory")
const nock = require('nock');
const githubAPINocks = require('../../support/githubAPINocks');
const authorizer = require("../../../../api/authorizers/site.js")
const siteErrors = require('../../../../api/responses/siteErrors');

describe("Site authorizer", () => {
  describe(".create(user, params)", () => {
    it("should resolve", done => {
      const params = {
        owner: crypto.randomBytes(3).toString("hex"),
        repository: crypto.randomBytes(3).toString("hex"),
        defaultBranch: "main",
        engine: "jekyll",
      }

      factory.user().then(user => {
        return authorizer.create(user, params)
      }).then(() => {
        done()
      }).catch(done)
    })
  })

  describe(".findOne(user, site)", () => {
    it("should resolve if the user is associated with the site", done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.findOne(user, site)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the user is not associated with the site", done => {
      const user = factory.user()
      const site = factory.site()

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.findOne(user, site)
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })
  })

  describe(".update(user, site)", () => {
    it("should resolve if the user is associated with the site", done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.update(user, site)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the user is not associated with the site", done => {
      const user = factory.user()
      const site = factory.site()

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.update(user, site)
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })
  })

  describe(".destroy(user, site)", () => {
    it("should resolve if the user is associated with the site", done => {
      const user = factory.user();
      const site = factory.site({ users: Promise.all([user]) });
      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: true, push: true },
        }],
      });

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the user is not associated with the site", done => {
      const user = factory.user();
      const site = factory.site();
      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: true, push: true },
        }],
      });

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).then(() => {
        done(new Error('Expected authorization error'));
      }).catch((err) => {
        expect(err).to.equal(403);
        done();
      }).catch(done)
    })

    it("should reject if the user is associated with the site but not an admin", done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })
      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: false, push: true },
        }],
      });

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err.status).to.equal(403)
        expect(err.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED)
        done()
      }).catch(done)
    })

    it('should accept if the user is associated with the site but site does not exist', done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })
      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [404, {}],
      });

      Promise.props({ user, site })
      .then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).then(() => {
        done()
      }).catch(done)
    })

    it('should reject if the user is associated with the site but returns error', done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })
      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [400, {}],
      });

      Promise.props({ user, site })
      .then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err.status).to.equal(403)
        expect(err.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED)
        done()
      }).catch(done)
    })
  })
})
