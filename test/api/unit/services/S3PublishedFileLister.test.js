const AWSMocks = require('../../support/aws-mocks')
const expect = require("chai").expect
const factory = require("../../support/factory")
const config = require("../../../../config")

const S3PublishedFileLister = require("../../../../api/services/S3PublishedFileLister")

describe("S3PublishedFileLister", () => {
  after(() => {
    AWSMocks.resetMocks()
  })

  describe(".listPublishedPreviews(site)", () => {
    it("should resolve with a list of published previews for the given site", done => {
      let site

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

      factory.site().then(model => {
        site = model
        return S3PublishedFileLister.listPublishedPreviews(site)
      }).then(publishedPreviews => {
        expect(publishedPreviews).to.deep.equal(["abc", "def", "ghi"])
        done()
      }).catch(done)
    })
  })
})
