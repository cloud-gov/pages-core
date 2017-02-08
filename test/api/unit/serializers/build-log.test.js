const expect = require("chai").expect
const validateJSONSchema = require('jsonschema').validate

const buildLogSchema = require("../../../../assets/swagger/BuildLog.json")
const factory = require("../../support/factory")
const validateAgainstJSONSchema = require("../../support/validateAgainstJSONSchema")

const BuildLogSerializer = require("../../../../api/serializers/build-log")

describe("BuildLogSerializer", () => {
  describe(".serialize(serializable)", () => {
    it("should serialize an object correctly", done => {
      factory.buildLog().then(buildLog => {
        return BuildLogSerializer.serialize(buildLog)
      }).then(object => {
        const result = validateJSONSchema(object, buildLogSchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })

    it("should serialize an array correctly", done => {
      const buildLogs = Array(3).fill(0).map(() => factory.buildLog())

      Promise.all(buildLogs).then(buildLogs => {
        return BuildLogSerializer.serialize(buildLogs)
      }).then(object => {
        const arraySchema = {
          type: "array",
          items: buildLogSchema,
        }
        const result = validateJSONSchema(object, arraySchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })
  })
})
