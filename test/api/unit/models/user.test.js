const expect = require("chai").expect
const { User } = require("../../../../api/models")

describe("User model", () => {
  describe("validations", () => {
    it("should validate that an email is formatted properly if present", done => {
      User.create({
        username: "bad-email-user",
        email: "thisisnotanemail",
      }).then(() => {
        done(new Error("Excepted validation error"))
      }).catch(err => {
        expect(err.name).to.equal("SequelizeValidationError")
        expect(err.errors[0].path).to.equal("email")
        done()
      }).catch(done)
    })

    it("should require a username to be present", done => {
      User.create({
        username: null,
        email: "email-me@example.com",
      }).then(() => {
        done(new Error("Excepted validation error"))
      }).catch(err => {
        expect(err.name).to.equal("SequelizeValidationError")
        expect(err.errors[0].path).to.equal("username")
        done()
      }).catch(done)
    })
  })
})
