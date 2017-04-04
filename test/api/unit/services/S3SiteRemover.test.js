const AWSMocks = require('../../support/aws-mocks')
const expect = require("chai").expect
const factory = require("../../support/factory")
const config = require("../../../../config")

const S3SiteRemover = require("../../../../api/services/S3SiteRemover")

describe("S3SiteRemover", () => {
  after(() => {
    AWSMocks.resetMocks()
  })

  describe(".removeSite(site)", () => {
    it("should delete all objects in the `site/<org>/<repo>` and `preview/<org>/<repo> directories", done => {
      const siteObjectsToDelete = []
      const previewObjectsToDelete = []
      let site
      let objectsWereDeleted = false
      let siteObjectsWereListed = false
      let previewObjectsWereListed = false

      AWSMocks.mocks.S3.listObjects = (params, cb) => {
        expect(params.Bucket).to.equal(config.s3.bucket)
        if (params.Prefix === `site/${site.owner}/${site.repository}`) {
          siteObjectsWereListed = true
          cb(null, {
            Contents: siteObjectsToDelete.map(Key => ({ Key }))
          })
        } else if (params.Prefix === `preview/${site.owner}/${site.repository}`) {
          previewObjectsWereListed = true
          cb(null, {
            Contents: previewObjectsToDelete.map(Key => ({ Key }))
          })
        }
      }
      AWSMocks.mocks.S3.deleteObjects = (params, cb) => {
        expect(params.Bucket).to.equal(config.s3.bucket)

        const objectsToDelete = siteObjectsToDelete.concat(previewObjectsToDelete)
        expect(params.Delete.Objects).to.have.length(objectsToDelete.length)
        params.Delete.Objects.forEach(object => {
          const index = objectsToDelete.indexOf(object.Key)
          expect(index).to.be.at.least(0)
          objectsToDelete.splice(index, 1)
        })
        objectsWereDeleted = true
        cb(null, {})
      }

      factory.site().then(model => {
        site = model

        const sitePrefix = `site/${site.owner}/${site.repository}`
        siteObjectsToDelete.push(`${sitePrefix}/index.html`)
        siteObjectsToDelete.push(`${sitePrefix}/redirect`)
        siteObjectsToDelete.push(`${sitePrefix}/redirect/index.html`)
        const previewPrefix = `preview/${site.owner}/${site.repository}`
        previewObjectsToDelete.push(`${previewPrefix}/index.html`)
        previewObjectsToDelete.push(`${previewPrefix}/redirect`)
        previewObjectsToDelete.push(`${previewPrefix}/redirect/index.html`)

        return S3SiteRemover.removeSite(site)
      }).then(() => {
        expect(siteObjectsWereListed).to.equal(true)
        expect(previewObjectsWereListed).to.equal(true)
        expect(objectsWereDeleted).to.equal(true)
        done()
      }).catch(done)
    })
  })
})
