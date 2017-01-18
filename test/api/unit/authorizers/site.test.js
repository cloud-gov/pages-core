const crypto = require("crypto")
const expect = require("chai").expect
const factory = require("../../support/factory")

const authorizer = require("../../../../api/authorizers/site.js")

describe("Site authorizer", () => {
  describe(".create(user, params)", () => {
    it("should resolve", done => {
      const params = {
        owner: crypto.randomBytes(3).toString("hex"),
        repository: crypto.randomBytes(3).toString("hex"),
        defaultBranch: "master",
        engine: "jekyll",
      }

      factory(User).then(user => {
        return authorizer.create(user, params)
      }).then(() => {
        done()
      })
    })
  })

  describe(".findOne(user, site)", () => {
    it("should resolve if the user is associated with the site", done => {
      const user = factory(User)
      const site = factory(Site, { users: Promise.all([user]) })

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.findOne(user, site)
      }).then(() => {
        done()
      })
    })

    it("should reject if the user is not associated with the site", done => {
      const user = factory(User)
      const site = factory(Site)

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.findOne(user, site)
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })
  })

  describe(".update(user, site)", () => {
    it("should resolve if the user is associated with the site", done => {
      const user = factory(User)
      const site = factory(Site, { users: Promise.all([user]) })

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.update(user, site)
      }).then(() => {
        done()
      })
    })

    it("should reject if the user is not associated with the site", done => {
      const user = factory(User)
      const site = factory(Site)

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.update(user, site)
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })
  })

  describe(".destroy(user, site)", () => {
    it("should resolve if the user is associated with the site", done => {
      const user = factory(User)
      const site = factory(Site, { users: Promise.all([user]) })

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).then(() => {
        done()
      })
    })

    it("should reject if the user is not associated with the site", done => {
      const user = factory(User)
      const site = factory(Site)

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.destroy(user, site)
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })
  })
})
