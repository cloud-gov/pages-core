const AWSMocks = require("../support/aws-mocks")
const expect = require("chai").expect
const request = require("supertest-as-promised")
const app = require("../../../app")
const config = require("../../../config")
const factory = require("../support/factory")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")

describe("Published Files API", () => {
  describe("GET /v0/site/:site_id/published-branch/:branch/file", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request(app)
          .get(`/v0/site/${site.id}/published-branch/${site.defaultBranch}`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{site_id}/published-branch/{branch}/published-file", 403, response.body)
        done()
      }).catch(done)
    })

    it("should list the files published to the branch for the site", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({
        defaultBranch: "master",
        users: Promise.all([userPromise]),
      })
      const cookiePromise = session(userPromise)

      AWSMocks.mocks.S3.listObjects = (params, callback) => {
        const prefix = `site/${site.owner}/${site.repository}`
        expect(params.Bucket).to.equal(config.s3.bucket)
        expect(params.Prefix).to.equal(prefix)

        callback(null, {
          Contents: [
            { Key: `${prefix}/abc`, Size: 123 },
            { Key: `${prefix}/abc/def`, Size: 456 },
            { Key: `${prefix}/ghi`, Size: 789 },
          ]
        })
      }

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      }).then(promisedValues => {
        site = promisedValues.site

        return request(app)
          .get(`/v0/site/${site.id}/published-branch/master/published-file`)
          .set("Cookie", promisedValues.cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{site_id}/published-branch/{branch}/published-file", 200, response.body)
        response.body.forEach(fileResponse => {
          delete fileResponse.publishedBranch
        })
        expect(response.body).to.include({ name: "abc", size: 123 })
        expect(response.body).to.include({ name: "abc/def", size: 456 })
        expect(response.body).to.include({ name: "ghi", size: 789 })
        done()
      }).catch(done)
    })

    it("should 403 if the user is not associated with the site", done => {
      const user = factory.user()
      const site = factory.site({ defaultBranch: "master" })
      const cookie = session(user)

      Promise.props({ user, site, cookie }).then(promisedValues => {
        return request(app)
          .get(`/v0/site/${promisedValues.site.id}/published-branch/master/published-file`)
          .set("Cookie", promisedValues.cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{site_id}/published-branch/{branch}/published-file", 403, response.body)
        done()
      }).catch(done)
    })
  })
})
