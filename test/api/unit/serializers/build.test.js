const expect = require("chai").expect
const validateJSONSchema = require('jsonschema').validate

const buildSchema = require("../../../../public/swagger/Build.json")
const factory = require("../../support/factory")

const BuildSerializer = require("../../../../api/serializers/build")

describe("BuildSerializer", () => {
  describe(".serialize(serializable)", () => {
    it("should serialize an object correctly", done => {
      factory.build().then(build => {
        return BuildSerializer.serialize(build)
      }).then(object => {
        const result = validateJSONSchema(object, buildSchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })

    it("should serialize an array correctly", done => {
      const builds = Array(3).fill(0).map(() => factory.build())

      Promise.all(builds).then(builds => {
        return BuildSerializer.serialize(builds)
      }).then(object => {
        const arraySchema = {
          type: "array",
          items: buildSchema,
        }
        const result = validateJSONSchema(object, arraySchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })
  })
})
