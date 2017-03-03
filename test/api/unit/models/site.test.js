const expect = require("chai").expect
const sinon = require("sinon")
const factory = require("../../support/factory")
const { Site } = require("../../../../api/models")

describe("Site model", () => {
  describe("before validate hook", () => {
    it("should lowercase the owner and repository values", done => {
      Site.create({
        owner: "RepoOwner",
        repository: "RepoName",
      }).then(site => {
        expect(site.owner).to.equal("repoowner")
        expect(site.repository).to.equal("reponame")
        done()
      }).catch(done)
    })
  })
})
