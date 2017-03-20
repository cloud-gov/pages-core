const expect = require("chai").expect
const validateJSONSchema = require('jsonschema').validate

const PublishedBranchSchema = require("../../../../public/swagger/PublishedBranch.json")
const factory = require("../../support/factory")

const PublishedBranchSerializer = require("../../../../api/serializers/published-branch")

describe("PublishedBranchesSerializer", () => {
  describe(".serialize(site, branch, files)", () => {
    it("should serialize a site with a list of published branches correctly", done => {
      let site

      factory.site({ defaultBranch: "default" }).then(model => {
        site = model
        return PublishedBranchSerializer.serialize(site, ["default", "preview"])
      }).then(object => {
        const defaultViewLink = site.viewLinkForBranch("default")
        const previewViewLink = site.viewLinkForBranch("preview")
        const result = validateJSONSchema(object, {
          type: "array",
          items: PublishedBranchSchema,
        })

        expect(result.errors).to.be.empty
        expect(object[0].name).to.equal("default")
        expect(object[0].viewLink).to.equal(defaultViewLink)
        expect(object[0].site.id).to.equal(site.id)
        expect(object[1].name).to.equal("preview")
        expect(object[1].viewLink).to.equal(previewViewLink)
        expect(object[1].site.id).to.equal(site.id)
        done()
      }).catch(done)
    })

    it("should serialize a site with a single published branch correctly", done => {
      let site

      factory.site({ defaultBranch: "default" }).then(model => {
        site = model
        return PublishedBranchSerializer.serialize(site, "default", ["abc", "abc/def", "ghi"])
      }).then(object => {
        const viewLink = site.viewLinkForBranch("default")
        const result = validateJSONSchema(object, PublishedBranchSchema)

        expect(result.errors).to.be.empty
        expect(object.name).to.equal("default")
        expect(object.viewLink).to.equal(viewLink)
        expect(object.site.id).to.equal(site.id)
        expect(object.files).to.deep.equal(["abc", "abc/def", "ghi"])
        done()
      }).catch(done)
    })
  })
})
