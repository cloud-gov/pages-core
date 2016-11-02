var expect = require("chai").expect
var request = require("supertest-as-promised")
var sinon = require("sinon")
var factory = require("../support/factory")

describe("Site API", () => {
  beforeEach(() => {
    sinon.stub(GitHub, "setWebhook", (_, __, done) => done())
  })

  afterEach(() => {
    GitHub.setWebhook.restore()
  })

  describe("GET /v0/site", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .get("/v0/site")
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should render a list of sites associated with the user")
    it("should not render any sites not associated with the user")
  })

  describe("GET /v0/site/:id", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .get(`/v0/site/${build.id}`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should redner a JSON representation of the site")
    it("should respond with a 401 if the user is not associated with the site")
  })

  describe("DELETE /v0/site/:id", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .delete(`/v0/site/${build.id}`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should allow a user to delete a site associated with their account")
    it("should not allow a user to delete a site not associated with their account")
  })

  describe("PUT /v0/site/:id", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .put(`/v0/site/${build.id}`, {
            defaultBranch: "master"
          })
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should allow a user to update a site associated with their account")
    it("should not allow a user to update a site not associated with their account")
    it("should trigger a rebuild of the site")
  })

  describe("POST /v0/site/clone", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .post(`/v0/site/clone`, {
            sourceOwner: "18f",
            sourceRepo: "example-template",
            destinationOrg: "partner-org",
            destinationRepo: "partner-site",
            destinationBranch: "master",
            engine: "jekyll"
          })
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should create a new site record for the given repository")
    it("should trigger a build that pushes the source repo to the destiantion repo")
  })
})
