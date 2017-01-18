const expect = require("chai").expect
const factory = require("../../support/factory")

const authorizer = require("../../../../api/authorizers/user.js")

describe("Site authorizer", () => {
  describe(".me(currentUser, targetUser)", () => {
    it("should resolve if the target user is the current user", done => {
      factory(User).then(user => {
        return authorizer.me(user, user)
      }).then(() => {
        done()
      })
    })

    it("should reject if the target user is not the current user", done => {
      Promise.all([factory(User), factory(User)]).then(users => {
        return authorizer.me(users[0], users[1])
      }).catch(err => {
        expect(err).to.equal(403)
        done()
      })
    })
  })
})
