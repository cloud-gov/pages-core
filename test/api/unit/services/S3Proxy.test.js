const expect = require("chai").expect
const AWSMocks = require("../../support/aws-mocks")
const config = require("../../../../config")
const factory = require("../../support/factory")

const S3Proxy = require("../../../../api/services/S3Proxy")

describe("S3Proxy", () => {
  let AWSGetObjectRequest
  let AWSGetObjectReadStream

  beforeEach(() => {
    AWSGetObjectRequest = {}
    AWSGetObjectReadStream = {}
    AWSGetObjectRequest.on = () => AWSGetObjectRequest
    AWSGetObjectRequest.createReadStream = () => AWSGetObjectReadStream
    AWSGetObjectReadStream.on = () => AWSGetObjectReadStream
    AWSGetObjectReadStream.pipe = () => {}
    AWSGetObjectRequest.hello = "world"
    AWSMocks.mocks.S3.getObject = () => AWSGetObjectRequest
  })

  afterEach(() => {
    AWSMocks.resetMocks()
  })

  describe(".proxy", (req, res) => {
    it("should pipe the object from S3 to the response", done => {
      const res = {}
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })

      AWSGetObjectReadStream.pipe = (candidate) => {
        expect(candidate).to.equal(res)
        done()
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        const [ user, site ] = results
        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`

        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: filename, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      }).catch(done)
    })

    it("should forward the headers from S3", done => {
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })

      const res = {
        set: (headers) => {
          expect(headers).to.deep.equal({
            header: "Value",
            ["X-Frame-Options"]: "SAMEORIGIN",
          })
          done()
        }
      }

      AWSGetObjectRequest.on = (action, cb) => {
        if (action === "httpHeaders") {
          cb(200, { header: "Value" })
        }
        return AWSGetObjectRequest
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        const [ user, site ] = results
        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`

        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: filename, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      }).catch(done)
    })

    it("should forward any errors encountered to the response", done => {
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })

      const res = {
        send: (statusCode, body) => {
          expect(statusCode).to.equal(400)
          expect(body).to.equal("Test error message")
          done()
        }
      }

      AWSGetObjectReadStream.on = (action, cb) => {
        if (action === "error") {
          cb({ statusCode: 400, message: "Test error message" })
        }
        return AWSGetObjectReadStream
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        const [ user, site ] = results
        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`

        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: filename, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      }).catch(done)
    })

    it("should reject with a 404 if the site does not exist", done => {
      factory.user().then(user => {
        const req = {
          params: { owner: "not-a-real-ower", repo: "not-a-real-repo" },
          user: user,
        }
        return S3Proxy.proxy(req, {})
      }).catch(err => {
        expect(err.status).to.equal(404)
        done()
      }).catch(done)
    })

    it("should pipe the object at `index.html` if the path has a trailing slash", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })

      AWSMocks.mocks.S3.getObject = params => {
        expect(params.Bucket).to.equal(config.s3.bucket)
        expect(params.Key).to.equal(`preview/${site.owner}/${site.repository}/branch/file/index.html`)
        done()
        return AWSGetObjectRequest
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        site = results[1]
        const [ user ] = results

        const path = `preview/${site.owner}/${site.repository}/branch/file`
        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: path, Size: 0 }, { Key: `${path}/index.html`, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${path}/`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      }).catch(done)
    })

    it("should 302 to the correct path if the request doesn't have a trailing slash", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })
      const res = {
        redirect: (status, path) => {
          expect(status).to.equal(302)
          expect(path).to.equal(`/preview/${site.owner}/${site.repository}/branch/file/`)
          done()
        }
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        site = results[1]
        const [ user ] = results

        const path = `preview/${site.owner}/${site.repository}/branch/file`
        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: path, Size: 0 }, { Key: `${path}/index.html`, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${path}`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      })
    })

    it("should respond with a 404 if the object does not exist", done => {
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })
      const res = { notFound: () => done() }

      Promise.all([userPromise, sitePromise]).then(results => {
        const [ user, site ] = results

        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`
        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: []
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      })
    })

    it("should 302 with a trailing slash if the object is the preview root", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })
      const res = {
        redirect: (status, path) => {
          expect(status).to.equal(302)
          expect(path).to.equal(`/preview/${site.owner}/${site.repository}/branch/`)
          done()
        }
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        site = results[1]
        const [ user ] = results

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/preview/${site.owner}/${site.repository}/branch`,
          user: user,
        }
        return S3Proxy.proxy(req, res)
      })
    })

    it("should allow unauthenticated users to view public previews", done => {
      const res = {}

      AWSGetObjectReadStream.pipe = (candidate) => {
        expect(candidate).to.equal(res)
        done()
      }

      factory.site({ publicPreview: true }).then(site => {
        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`

        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: filename, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
        }
        return S3Proxy.proxy(req, res)
      }).catch(done)
    })

    it("should reject with a 403 for an unauthenticated user viewing a private preivew", done => {
      factory.site({ publicPreview: false }).then(site => {
        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`
        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: filename, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
        }
        return S3Proxy.proxy(req, res)
      }).catch(err => {
        expect(err.status).to.equal(403)
        done()
      }).catch(done)
    })

    it("should allow authenticated users to view private previews for their sites", done => {
      const res = {}
      const userPromise = factory.user()
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
        publicPreview: false,
      })

      AWSGetObjectReadStream.pipe = (candidate) => {
        expect(candidate).to.equal(res)
        done()
      }

      Promise.all([userPromise, sitePromise]).then(results => {
        const[ user, site ] = results

        const filename = `preview/${site.owner}/${site.repository}/branch/file.txt`
        AWSMocks.mocks.S3.listObjects = (params, cb) => cb(null, {
          Contents: [{ Key: filename, Size: 1000 }]
        })

        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `/${filename}`,
          user,
        }
        return S3Proxy.proxy(req, res)
      }).catch(done)
    })

    it("should reject with a 403 for an authenticated user viewing a site that isn't theirs", done => {
      Promise.all([factory.user(), factory.site({ publicPreview: false })]).then(results => {
        const[ user, site ] = results
        const req = {
          params: { owner: site.owner, repo: site.repository },
          path: `preview/${site.owner}/${site.repository}/branch/file.txt`,
          user,
        }
        return S3Proxy.proxy(req, {})
      }).catch(err => {
        expect(err.status).to.equal(403)
        done()
      }).catch(done)
    })
  })
})
