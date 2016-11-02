var expect = require("chai").expect
var request = require("supertest-as-promised")
var sinon = require("sinon")
var factory = require("../support/factory")
var session = require("../support/session")

describe("Site API", () => {
  beforeEach(() => {
    sinon.stub(GitHub, "setWebhook", (_, __, done) => done())
  })

  afterEach(() => {
    GitHub.setWebhook.restore()
  })

  var siteResponseExpectations = (response, site) => {
    expect(response.owner).to.equal(site.owner)
    expect(response.repository).to.equal(site.repository)
    expect(response.engine).to.equal(site.engine)
    expect(response.defaultBranch).to.equal(site.defaultBranch)
    expect(response.publicPreview).to.equal(site.publicPreview)

    expect(response.users.map(user => user.id))
      .to.have.members(site.users.map(user => user.id))

    expect(response.builds).to.be.a("array")
    expect(response.siteRoot).to.be.a("string")
    expect(response.viewLink).to.be.a("string")
  }

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

    it("should render a list of sites associated with the user", done => {
      var user, sites, response

      factory(User).then(model => {
        user = model
        var sitePromises = Array(3).fill(0).map(() => {
          return factory(Site, { users: [user.id] })
        })
        return Promise.all(sitePromises)
      }).then(models => {
        sites = models
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get("/v0/site")
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        response = resp

        expect(response.body).to.be.a("array")
        expect(response.body).to.have.length(3)

        return Promise.all(sites.map(site => {
          return Site.findOne({ id: site.id }).populate("users")
        }))
      }).then(sites => {
        sites.forEach((site, index) => {
          siteResponseExpectations(response.body[index], site)
        })
        done()
      })
    })

    it("should not render any sites not associated with the user", done => {
      var user

      factory(User).then(model => {
        user = model
        var sitePromises = Array(3).fill(0).map(() => {
          return factory(Site)
        })
        return Promise.all(sitePromises)
      }).then(site => {
        expect(site).to.have.length(3)
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get("/v0/site")
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(response.body).to.be.a("array")
        expect(response.body).to.be.empty
        done()
      })
    })
  })

  describe("GET /v0/site/:id", () => {
    it("should require authentication", done => {
      factory(Site).then(site => {
        return request("http://localhost:1337")
          .get(`/v0/site/${site.id}`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should render a JSON representation of the site", done => {
      var site

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        return session(site.users[0])
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        siteResponseExpectations(response.body, site)
        done()
      })
    })

    it("should respond with a 403 if the user is not associated with the site", done => {
      var site

      factory(Site).then(model => {
        site = model
        return factory(User)
      }).then(user => {
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })
  })

  describe("DELETE /v0/site/:id", () => {
    it("should require authentication", done => {
      factory(Site).then(site => {
        return request("http://localhost:1337")
          .delete(`/v0/site/${site.id}`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should allow a user to delete a site associated with their account", done => {
      var site

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        return session(site.users[0])
      }).then(cookie => {
        return request("http://localhost:1337")
          .delete(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        siteResponseExpectations(response.body, site)
        return Site.find({ id: site.id })
      }).then(sites => {
        expect(sites).to.be.empty
        done()
      })
    })

    it("should not allow a user to delete a site not associated with their account", done => {
      var site

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        return session(factory(User))
      }).then(cookie => {
        return request("http://localhost:1337")
          .delete(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        return Site.find({ id: site.id })
      }).then(sites => {
        expect(sites).not.to.be.empty
        done()
      })
    })
  })

  describe("PUT /v0/site/:id", () => {
    it("should require authentication", done => {
      factory(Site).then(site => {
        return request("http://localhost:1337")
          .put(`/v0/site/${site.id}`, {
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
      factory(Site).then(site => {
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
