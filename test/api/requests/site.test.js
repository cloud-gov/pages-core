var crypto = require("crypto")
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
      var sitePromises = Array(3).fill(0).map(() => {
        return factory(Site)
      })

      Promise.all(sitePromises).then(site => {
        expect(site).to.have.length(3)
        return session(factory(User))
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
        return session(factory(User))
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
          .put(`/v0/site/${site.id}`)
          .send({
            defaultBranch: "master"
          })
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should allow a user to update a site associated with their account", done => {
      var site, response

      factory(Site, { repository: "old-repo-name" }).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        return session(site.users[0])
      }).then(cookie => {
        return request("http://localhost:1337")
          .put(`/v0/site/${site.id}`)
          .send({
            repository: "new-repo-name"
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        response = resp
        return Site.findOne({ id: site.id }).populate("users")
      }).then(site => {
        expect(response.body).to.have.property("repository", "new-repo-name")
        expect(site).to.have.property("repository", "new-repo-name")
        siteResponseExpectations(response.body, site)
        done()
      })
    })

    it("should not allow a user to update a site not associated with their account", done => {
      factory(Site, { repository: "old-repo-name" }).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        return session(factory(User))
      }).then(cookie => {
        return request("http://localhost:1337")
          .put(`/v0/site/${site.id}`)
          .send({
            repository: "new-repo-name"
          })
          .set("Cookie", cookie)
          .expect(403)
      }).then(resp => {
        response = resp
        expect(response.body).to.be.empty
        return Site.findOne({ id: site.id }).populate("users")
      }).then(site => {
        expect(site).to.have.property("repository", "old-repo-name")
        done()
      })
    })

    it("should trigger a rebuild of the site", done => {
      factory(Site, { repository: "old-repo-name" }).then(site => {
        return Site.findOne({ id: site.id }).populate("users").populate("builds")
      }).then(model => {
        site = model
        expect(site.builds).to.have.length(1)
        return session(site.users[0])
      }).then(cookie => {
        return request("http://localhost:1337")
          .put(`/v0/site/${site.id}`)
          .send({
            repository: "new-repo-name"
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        return Site.findOne({ id: site.id }).populate("users").populate("builds")
      }).then(site => {
        expect(site.builds).to.have.length(2)
        done()
      })
    })
  })

  describe("POST /v0/site/clone", () => {
    it("should require authentication", done => {
      var cloneRequest = request("http://localhost:1337")
        .post(`/v0/site/clone`)
        .send({
          sourceOwner: "18f",
          sourceRepo: "example-template",
          destinationOrg: "partner-org",
          destinationRepo: "partner-site",
          destinationBranch: "master",
          engine: "jekyll"
        })
        .expect(403)

      cloneRequest.then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should create a new site record for the given repository", done => {
      var user, response

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
        .post(`/v0/site/clone`)
        .send({
          sourceOwner: "18f",
          sourceRepo: "example-template",
          destinationOrg: "partner-org",
          destinationRepo: "partner-site",
          destinationBranch: "master",
          engine: "jekyll"
        })
        .set("Cookie", cookie)
        .expect(200)
      }).then(resp => {
        response = resp
        return Site.findOne({ id: response.body.id }).populate("users")
      }).then(site => {
        expect(site).to.have.property("owner", "partner-org")
        expect(site).to.have.property("repository", "partner-site")
        expect(site).to.have.property("defaultBranch", "master")
        expect(site).to.have.property("engine", "jekyll")
        expect(site).not.to.be.undefined
        expect(site.users).to.have.length(1)
        expect(site.users[0]).to.have.property("id", user.id)

        siteResponseExpectations(response.body, site)

        done()
      })
    })

    it("should trigger a build that pushes the source repo to the destiantion repo", done => {
      var user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
        .post(`/v0/site/clone`)
        .send({
          sourceOwner: "18f",
          sourceRepo: "example-template",
          destinationOrg: "partner-org",
          destinationRepo: "partner-site",
          destinationBranch: "master",
          engine: "jekyll"
        })
        .set("Cookie", cookie)
        .expect(200)
      }).then(response => {
        return Site.findOne({ id: response.body.id }).populate("builds")
      }).then(site => {
        expect(site.builds).to.have.length(1)

        var buildSource = site.builds[0].source
        expect(buildSource).to.have.property("owner", "18f")
        expect(buildSource).to.have.property("repository", "example-template")
        done()
      })
    })

    it("should create a webhook for the new site", done => {
      var user
      var siteOwner = crypto.randomBytes(3).toString("hex")
      var siteRepository = crypto.randomBytes(3).toString("hex")

      GitHub.setWebhook.restore()
      sinon.stub(GitHub, "setWebhook", (stubbedSite, stubbedUserID) => {
        expect(stubbedUserID).to.equal(user.id)
        expect(stubbedSite.owner).to.equal(siteOwner)
        expect(stubbedSite.repository).to.equal(siteRepository)
        done()
      })

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
        .post(`/v0/site/clone`)
        .send({
          sourceOwner: "18f",
          sourceRepo: "example-template",
          destinationOrg: siteOwner,
          destinationRepo: siteRepository,
          destinationBranch: "master",
          engine: "jekyll"
        })
        .set("Cookie", cookie)
        .expect(200)
      })
    })
  })
})
