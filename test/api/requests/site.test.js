const crypto = require("crypto")
const expect = require("chai").expect
const nock = require("nock")
const request = require("supertest-as-promised")
const sinon = require("sinon")

const app = require("../../../app")
const factory = require("../support/factory")
const githubAPINocks = require("../support/githubAPINocks")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")

const { Build, Site, User } = require("../../../api/models")
const S3SiteRemover = require("../../../api/services/S3SiteRemover")

describe("Site API", () => {
  var siteResponseExpectations = (response, site) => {
    expect(response.owner).to.equal(site.owner)
    expect(response.repository).to.equal(site.repository)
    expect(response.engine).to.equal(site.engine)
    expect(response.defaultBranch).to.equal(site.defaultBranch)
    expect(response.publicPreview).to.equal(site.publicPreview)
    expect(response.siteRoot).to.be.a("string")
    expect(response.viewLink).to.be.a("string")
  }

  describe("GET /v0/site", () => {
    it("should require authentication", done => {
      factory.build().then(build => {
        return request(app)
          .get("/v0/site")
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site", 403, response.body)
        done()
      }).catch(done)
    })

    it("should render a list of sites associated with the user", done => {
      var user, sites, response

      factory.user().then(model => {
        user = model
        var sitePromises = Array(3).fill(0).map(() => {
          return factory.site({ users: [user.id] })
        })
        return Promise.all(sitePromises)
      }).then(models => {
        sites = models
        return session(user)
      }).then(cookie => {
        return request(app)
          .get("/v0/site")
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        response = resp

        validateAgainstJSONSchema("GET", "/site", 200, response.body)

        expect(response.body).to.be.a("array")
        expect(response.body).to.have.length(3)

        return Promise.all(sites.map(site => {
          return Site.findById(site.id, { include: [ User ]})
        }))
      }).then(sites => {
        sites.forEach(site => {
          const responseSite = response.body.find(candidate => {
            return candidate.id === site.id
          })
          expect(responseSite).not.to.be.undefined
          siteResponseExpectations(responseSite, site)
        })
        done()
      }).catch(done)
    })

    it("should not render any sites not associated with the user", done => {
      var sitePromises = Array(3).fill(0).map(() => {
        return factory.site()
      })

      Promise.all(sitePromises).then(site => {
        expect(site).to.have.length(3)
        return session(factory.user())
      }).then(cookie => {
        return request(app)
          .get("/v0/site")
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site", 200, response.body)
        expect(response.body).to.be.a("array")
        expect(response.body).to.be.empty
        done()
      }).catch(done)
    })
  })

  describe("GET /v0/site/:id", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request(app)
          .get(`/v0/site/${site.id}`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{id}", 403, response.body)
        done()
      }).catch(done)
    })

    it("should render a JSON representation of the site", done => {
      var site

      factory.site().then(site => {
        return Site.findById(site.id, { include: [ User ] })
      }).then(model => {
        site = model
        return session(site.Users[0])
      }).then(cookie => {
        return request(app)
          .get(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{id}", 200, response.body)
        siteResponseExpectations(response.body, site)
        done()
      }).catch(done)
    })

    it("should respond with a 403 if the user is not associated with the site", done => {
      var site

      factory.site().then(model => {
        site = model
        return session(factory.user())
      }).then(cookie => {
        return request(app)
          .get(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/site/{id}", 403, response.body)
        done()
      }).catch(done)
    })
  })

  describe("POST /v0/site", () => {
    beforeEach(() => {
      nock.cleanAll()
      githubAPINocks.repo()
      githubAPINocks.createRepoForOrg()
      githubAPINocks.webhook()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it("should require authentication", done => {
      const newSiteRequest = request(app)
        .post(`/v0/site`)
        .send({
          organization: "partner-org",
          repository: "partner-site",
          defaultBranch: "master",
          engine: "jekyll"
        })
        .expect(403)

      newSiteRequest.then(response => {
        validateAgainstJSONSchema("POST", "/site", 403, response.body)
        done()
      }).catch(done)
    })

    it("should create a new site from an existing repository", done => {
      const siteOwner = crypto.randomBytes(3).toString("hex")
      const siteRepository = crypto.randomBytes(3).toString("hex")

      session().then(cookie => {
        return request(app)
          .post(`/v0/site`)
          .send({
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 200, response.body)
        return Site.findOne({
          where: {
            owner: siteOwner,
            repository: siteRepository,
          },
        })
      }).then(site => {
        expect(site).to.not.be.undefined
        done()
      }).catch(done)
    })

    it("should add a user to an existing site for an existing repository", done => {
      let user, site
      const userPromise = factory.user()

      Promise.props({
        user: userPromise,
        site: factory.site(),
        cookie: session(userPromise),
      }).then(models => {
        user = models.user
        site = models.site

        githubAPINocks.repo()

        return request(app)
          .post(`/v0/site`)
          .send({
            owner: site.owner,
            repository: site.repository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", models.cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 200, response.body)
        return Site.findAll({
          where: {
            owner: site.owner,
            repository: site.repository,
          },
          include: [ User ],
        })
      }).then(sites => {
        expect(sites).to.have.length(1)
        const site = sites[0]
        const addedUser = site.Users.find(candidate => candidate.id === user.id)
        expect(addedUser).to.not.be.undefined
        done()
      }).catch(done)
    })

    it("should create a new repo and site from a template", done => {
      const siteOwner = crypto.randomBytes(3).toString("hex")
      const siteRepository = crypto.randomBytes(3).toString("hex")

      nock.cleanAll()
      githubAPINocks.repo()
      githubAPINocks.webhook()

      const createRepoNock = githubAPINocks.createRepoForOrg({
        org: siteOwner,
        repo: siteRepository,
      })

      session().then(cookie => {
        return request(app)
          .post(`/v0/site`)
          .send({
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll",
            template: "team",
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 200, response.body)
        return Site.findOne({
          where: {
            owner: siteOwner,
            repository: siteRepository,
          },
        })
      }).then(site => {
        expect(site).to.not.be.undefined
        expect(createRepoNock.isDone()).to.equal(true)
        done()
      }).catch(done)
    })

    it("should respond with a 400 if no user or repository is specified", done => {
      session().then(cookie => {
        return request(app)
          .post(`/v0/site`)
          .send({
            defaultBranch: "master",
            engine: "jekyll",
            template: "team",
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 400, response.body)
        done()
      }).catch(done)
    })

    it("should respond with a 400 if a user has already added a site", done => {
      const userPromise = factory.user()

      Promise.props({
        user: userPromise,
        site: factory.site({ users: Promise.all([userPromise]) }),
        cookie: session(userPromise),
      }).then(({ site, cookie }) => {
        return request(app)
          .post(`/v0/site`)
          .send({
            owner: site.owner,
            repository: site.repository,
            defaultBranch: "master",
            engine: "jekyll",
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 400, response.body)
        expect(response.body.message).to.equal("You've already added this site to Federalist")
        done()
      }).catch(done)
    })

    it("should respond with a 400 if the user does not have admin access to the repository", done => {
      const siteOwner = crypto.randomBytes(3).toString("hex")
      const siteRepository = crypto.randomBytes(3).toString("hex")

      nock.cleanAll()
      githubAPINocks.repo({
        owner: siteOwner,
        repository: siteRepository,
        response: [200, {
          permissions: { admin: false, push: false }
        }],
      })
      githubAPINocks.webhook()

      session().then(cookie => {
        return request(app)
          .post(`/v0/site`)
          .send({
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll",
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 400, response.body)
        expect(response.body.message).to.equal("You do not have admin access to this repository")
        done()
      }).catch(done)
    })

    it("should respond with a 400 if the site has been created by a user who does not have write access to the repository", done => {
      let site
      factory.site().then(model => {
        site = model

        nock.cleanAll()
        githubAPINocks.repo({
          owner: site.owner,
          repository: site.repository,
          response: [200, {
            permissions: { admin: false, push: false }
          }],
        })
        githubAPINocks.webhook()

        return session()
      }).then(cookie => {
        return request(app)
          .post(`/v0/site`)
          .send({
            owner: site.owner,
            repository: site.repository,
            defaultBranch: "master",
            engine: "jekyll",
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 400, response.body)
        expect(response.body.message).to.equal("You do not have write access to this repository")
        done()
      }).catch(done)
    })

    it("should respond with a 400 if a webhook cannot be created", done => {
      const siteOwner = crypto.randomBytes(3).toString("hex")
      const siteRepository = crypto.randomBytes(3).toString("hex")

      nock.cleanAll()
      githubAPINocks.repo()
      githubAPINocks.webhook({
        owner: siteOwner,
        repo: siteRepository,
        response: [404, {
          message: "Not Found",
        }]
      })

      session().then(cookie => {
        return request(app)
          .post(`/v0/site`)
          .send({
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll",
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/site", 400, response.body)
        expect(response.body.message).to.equal("You do not have admin access to this repository")
        done()
      }).catch(done)
    })
  })

  describe("DELETE /v0/site/:id", () => {
    beforeEach(() => {
      sinon.stub(S3SiteRemover, "removeSite", () => Promise.resolve())
    })

    afterEach(() => {
      S3SiteRemover.removeSite.restore()
    })

    it("should require authentication", done => {
      factory.site().then(site => {
        return request(app)
          .delete(`/v0/site/${site.id}`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("DELETE", "/site/{id}", 403, response.body)
        done()
      })
    })

    it("should allow a user to delete a site associated with their account", done => {
      var site

      factory.site().then(site => {
        return Site.findById(site.id, { include: [ User ] })
      }).then(model => {
        site = model
        return session(site.Users[0])
      }).then(cookie => {
        return request(app)
          .delete(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("DELETE", "/site/{id}", 200, response.body)
        siteResponseExpectations(response.body, site)
        return Site.findAll({ where: { id: site.id } })
      }).then(sites => {
        expect(sites).to.be.empty
        done()
      }).catch(done)
    })

    it("should not allow a user to delete a site not associated with their account", done => {
      var site

      factory.site().then(site => {
        return Site.findById(site.id)
      }).then(model => {
        site = model
        return session(factory.user())
      }).then(cookie => {
        return request(app)
          .delete(`/v0/site/${site.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("DELETE", "/site/{id}", 403, response.body)
        return Site.findAll({ where: { id: site.id } })
      }).then(sites => {
        expect(sites).not.to.be.empty
        done()
      }).catch(done)
    })

    it("should remove all of the site's data from S3", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })
      const sessionPromise = session(userPromise)

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: sessionPromise,
      }).then(results => {
        site = results.site
        S3SiteRemover.removeSite.restore()
        sinon.stub(S3SiteRemover, "removeSite", (calledSite) => {
          expect(calledSite.id).to.equal(site.id)
          return Promise.resolve()
        })

        return request(app)
          .delete(`/v0/site/${site.id}`)
          .set("Cookie", results.cookie)
          .expect(200)
      }).then(response => {
        expect(S3SiteRemover.removeSite.calledOnce).to.equal(true)
        done()
      }).catch(done)
    })
  })

  describe("PUT /v0/site/:id", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            defaultBranch: "master"
          })
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("PUT", "/site/{id}", 403, response.body)
        done()
      }).catch(done)
    })

    it("should allow a user to update a site associated with their account", done => {
      var site, response

      factory.site({ config: "old-config", previewConfig: "old-preview-config" }).then(site => {
        return Site.findById(site.id, { include: [ User ] })
      }).then(model => {
        site = model
        return session(site.Users[0])
      }).then(cookie => {
        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            config: "new-config",
            previewConfig: "new-preview-config",
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        response = resp
        return Site.findById(site.id, { include: [ User ] })
      }).then(site => {
        validateAgainstJSONSchema("PUT", "/site/{id}", 200, response.body)

        expect(response.body.config).to.equal("new-config")
        expect(site.config).to.equal("new-config")
        expect(response.body.previewConfig).to.equal("new-preview-config")
        expect(site.previewConfig).to.equal("new-preview-config")
        siteResponseExpectations(response.body, site)

        done()
      }).catch(done)
    })

    it("should not allow a user to update a site not associated with their account", done => {
      factory.site({ repository: "old-repo-name" }).then(site => {
        return Site.findById(site.id)
      }).then(model => {
        site = model
        return session(factory.user())
      }).then(cookie => {
        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            repository: "new-repo-name"
          })
          .set("Cookie", cookie)
          .expect(403)
      }).then(resp => {
        response = resp
        validateAgainstJSONSchema("PUT", "/site/{id}", 403, response.body)
        return Site.findById(site.id)
      }).then(site => {
        expect(site).to.have.property("repository", "old-repo-name")
        done()
      }).catch(done)
    })

    it("should trigger a rebuild of the site", done => {
      factory.site({ repository: "old-repo-name" }).then(site => {
        return Site.findById(site.id, { include: [ User, Build ] })
      }).then(model => {
        site = model
        expect(site.Builds).to.have.length(0)
        return session(site.Users[0])
      }).then(cookie => {
        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            repository: "new-repo-name"
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        return Site.findById(site.id, { include: [ User, Build ] })
      }).then(site => {
        expect(site.Builds).to.have.length(1)
        expect(site.Builds[0].branch).to.equal(site.defaultBranch)
        done()
      }).catch(done)
    })

    it("should trigger a rebuild of the demo branch if one is present", done => {
      factory.site({
        repository: "old-repo-name",
        demoBranch: "demo",
        demoDomain: "https://demo.example.gov"
      }).then(site => {
        return Site.findById(site.id, { include: [ User, Build ] })
      }).then(model => {
        site = model
        expect(site.Builds).to.have.length(0)
        return session(site.Users[0])
      }).then(cookie => {
        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            repository: "new-repo-name"
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        return Site.findById(site.id, { include: [ User, Build ] })
      }).then(site => {
        expect(site.Builds).to.have.length(2)
        const demoBuild = site.Builds.find(candidateBuild => {
          return candidateBuild.branch === site.demoBranch
        })
        expect(demoBuild).to.not.be.undefined
        done()
      }).catch(done)
    })

    it("should update attributes when the value in the request body is an empty string", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
        config: "old-config: true",
        domain: "https://example.com",
      })
      const cookiePromise = session(userPromise)

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      }).then(results => {
        site = results.site

        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            config: "",
            domain: "",
          })
          .set("Cookie", results.cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("PUT", "/site/{id}", 200, response.body)
        return Site.findById(site.id)
      }).then(site => {
        expect(site.config).to.equal("")
        expect(site.domain).to.equal("")
        done()
      }).catch(done)
    })

    it("should not override existing attributes if they are not present in the request body", done => {
      let site
      const userPromise = factory.user()
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
        config: "old-config: true",
        domain: "https://example.com",
      })
      const cookiePromise = session(userPromise)

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      }).then(results => {
        site = results.site

        return request(app)
          .put(`/v0/site/${site.id}`)
          .send({
            config: "new-config: true",
          })
          .set("Cookie", results.cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("PUT", "/site/{id}", 200, response.body)
        return Site.findById(site.id)
      }).then(site => {
        expect(site.config).to.equal("new-config: true")
        expect(site.domain).to.equal("https://example.com")
        done()
      }).catch(done)
    })
  })
})
