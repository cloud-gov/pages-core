const expect = require("chai").expect
const factory = require("../../support/factory")

const authorizer = require("../../../../api/authorizers/build.js")

describe("Build authorizer", () => {
  describe("findOne(user, build)", () => {
    it("should resolve if the build is associated with one of the user's site", done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })
      const build = factory.build({ site: site })

      Promise.props({ user, site, build }).then(({ user, site, build }) => {
        authorizer.findOne(user, build)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the build is not associated with one of the user's sites", done => {
      Promise.props({
        user: factory.user(),
        build: factory.build(),
      }).then(({ user, build }) => {
        return authorizer.findOne(user, build)
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })

    it("should reject if the build is not associated with one of the user's site even if the user started the build", done => {
      const user = factory.user()
      const build = factory.build({ user: user, site: factory.site() })

      Promise.props({ user, build }).then(({ user, build }) => {
        return authorizer.findOne(user, build)
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })
  })

  describe("create(user, params)", () => {
    it("should resolve if the build is associated with one of the user's site", done => {
      const user = factory.user()
      const site = factory.site({ users: Promise.all([user]) })

      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.create(user, { user: user.id, site: site.id })
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the build is not associated with one of the user's sites", done => {
      Promise.props({
        user: factory.user(),
        site: factory.site(),
      }).then(({ user, build }) => {
        return authorizer.create(user, { user: user.id, site: site.id })
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })

    it("should reject if the build is not associated with the current user", done => {
      const user = factory.user()
      const otherUser = factory.user()
      const site = factory.site({ users: Promise.all([user, otherUser]) })
      Promise.props({ user, otherUser, site }).then(({ user, otherUser, site }) => {
        return authorizer.create(user, { user: otherUser.id, site: site.id })
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })
  })
})
