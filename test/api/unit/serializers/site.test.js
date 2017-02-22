const expect = require("chai").expect
const validateJSONSchema = require('jsonschema').validate

const siteSchema = require("../../../../assets/swagger/Site.json")
const factory = require("../../support/factory")

const SiteSerializer = require("../../../../api/serializers/site")

describe("SiteSerializer", () => {
  describe(".serialize(serializable)", () => {
    it("should serialize an object correctly", done => {
      factory.site().then(site => {
        return SiteSerializer.serialize(site)
      }).then(object => {
        const result = validateJSONSchema(object, siteSchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })

    it("should serialize an array correctly", done => {
      const sites = Array(3).fill(0).map(() => factory.site())

      Promise.all(sites).then(sites => {
        return SiteSerializer.serialize(sites)
      }).then(object => {
        const arraySchema = {
          type: "array",
          items: siteSchema,
        }
        const result = validateJSONSchema(object, arraySchema)
        expect(result.errors).to.be.empty
        done()
      }).catch(done)
    })
  })
})
