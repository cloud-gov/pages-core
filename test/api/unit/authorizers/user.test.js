const expect = require("chai").expect
const factory = require("../../support/factory")

const authorizer = require("../../../../api/authorizers/user.js")

describe("User authorizer", () => {
  describe(".me(currentUser, targetUser)", () => {
    it("should resolve if the target user is the current user", done => {
      factory.user().then(user => {
        return authorizer.me(user, user)
      }).then(() => {
        done()
      }).catch(done)
    })

    it("should reject if the target user is not the current user", done => {
      Promise.all([factory.user(), factory.user()]).then(users => {
        return authorizer.me(users[0], users[1])
      }).then(() => {
        done(new Error("Expected authorization error"))
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      }).catch(done)
    })
  })
})
