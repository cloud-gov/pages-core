const expect = require("chai").expect
const validateJSONSchema = require('jsonschema').validate

const userSchema = require("../../../../public/swagger/User.json")
const factory = require("../../support/factory")

const UserSerializer = require("../../../../api/serializers/user")

describe("UserSerializer", () => {
  describe(".serialize(serializable)", () => {
    it("should serialize an object correctly", done => {
      factory.user().then(user => {
        return UserSerializer.serialize(user)
      }).then(object => {
        const result = validateJSONSchema(object, userSchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })

    it("should serialize an array correctly", done => {
      const users = Array(3).fill(0).map(() => factory.user())

      Promise.all(users).then(users => {
        return UserSerializer.serialize(users)
      }).then(object => {
        const arraySchema = {
          type: "array",
          items: userSchema,
        }
        const result = validateJSONSchema(object, arraySchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })
  })
})
