const expect = require("chai").expect
const factory = require("../../support/factory")

const authorizer = require("../../../../api/authorizers/build.js")

describe("Build authorizer", () => {
  describe("findOne(user, build)", () => {
    it("should resolve if the build is associated with one of the user's site", done => {
      factory(User).then(user => {
        const site = factory(Site, { users: [user] })
        return Promise.props({
          user: user,
          build: factory(Build, { site: site }),
        })
      }).then(({ user, build }) => {
        return authorizer.findOne(user, build)
      }).then(() => {
        done()
      })
    })

    it("should reject if the build is not associated with one of the user's sites", done => {
      Promise.props({
        user: factory(User),
        build: factory(Build),
      }).then(({ user, build }) => {
        return authorizer.findOne(user, build)
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })

    it("should reject if the build is not associated with one of the user's site even if the user started the build", done => {
      const user = factory(User)
      const build = factory(Build, { user: user, site: factory(Site) })
      Promise.props({ user, build }).then(({ user, build }) => {
        return authorizer.findOne(user, build)
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })
  })

  describe("create(user, params)", () => {
    it("should resolve if the build is associated with one of the user's site", done => {
      const user = factory(User)
      const site = factory(Site, { users: Promise.all([user]) })
      Promise.props({ user, site }).then(({ user, site }) => {
        return authorizer.create(user, { user: user.id, site: site.id })
      }).then(() => {
        done()
      })
    })

    it("should reject if the build is not associated with one of the user's sites", done => {
      Promise.props({
        user: factory(User),
        site: factory(Site),
      }).then(({ user, build }) => {
        return authorizer.create(user, { user: user.id, site: site.id })
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })

    it("should reject if the build is not associated with the current user", done => {
      const user = factory(User)
      const otherUser = factory(User)
      const site = factory(Site, { users: Promise.all([user, otherUser]) })
      Promise.props({ user, otherUser, site }).then(({ user, otherUser, site }) => {
        return authorizer.create(user, { user: otherUser.id, site: site.id })
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })
  })
})
