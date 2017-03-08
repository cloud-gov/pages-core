const AWSMocks = require("../support/aws-mocks")
const expect = require("chai").expect
const request = require("supertest-as-promised")
const config = require("../../../config")
const factory = require("../support/factory")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")
const { Site } = require("../../../api/models")

describe("Published Files API", () => {
  after(() => {
    AWSMocks.resetMocks()
  })

  describe("GET /v0/site/:site_id/published-branch", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request("http://localhost:1337")
          .get(`/v0/site/${site.id}/published-branch`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{site_id}/published-branch", 403, response.body)
        done()
      }).catch(done)
    })

    it("should list the previews available on S3 for a user's site", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })
      const cookiePromise = session(userPromise)

      AWSMocks.mocks.S3.listObjects = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket)
        expect(params.Prefix).to.equal(`preview/${site.owner}/${site.repository}/`)
        expect(params.Delimiter).to.equal("/")
        callback(null, {
          Contents: [],
          CommonPrefixes: [
            { Prefix: `preview/${site.owner}/${site.repository}/abc/` },
            { Prefix: `preview/${site.owner}/${site.repository}/def/` },
            { Prefix: `preview/${site.owner}/${site.repository}/ghi/` },
          ],
        })
      }

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      }).then(promisedValues => {
        site = promisedValues.site

        return request("http://localhost:1337")
          .get(`/v0/site/${site.id}/published-branch`)
          .set("Cookie", promisedValues.cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{site_id}/published-branch", 200, response.body)
        const branchNames = response.body.map(branch => branch.name)
        expect(branchNames).to.include(site.defaultBranch)
        expect(branchNames).to.include("abc")
        expect(branchNames).to.include("def")
        expect(branchNames).to.include("ghi")
        done()
      }).catch(done)
    })

    it("should 403 if the user is not associated with the site", done => {
      const user = factory.user()
      const site = factory.site()
      const cookie = session(user)

      Promise.props({ user, site, cookie }).then(promisedValues => {
        return request("http://localhost:1337")
          .get(`/v0/site/${promisedValues.site.id}/published-branch`)
          .set("Cookie", promisedValues.cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{site_id}/published-branch", 403, response.body)
        done()
      }).catch(done)
    })
  })
})
