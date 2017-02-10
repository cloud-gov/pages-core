const crypto = require("crypto")
const expect = require("chai").expect
const nock = require("nock")
const request = require("supertest-as-promised")
const sinon = require("sinon")

const factory = require("../support/factory")
const githubAPINocks = require("../support/githubAPINocks")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")

describe("Site API", () => {
  var siteResponseExpectations = (response, site) => {
    expect(response.owner).to.equal(site.owner)
    expect(response.repository).to.equal(site.repository)
    expect(response.engine).to.equal(site.engine)
    expect(response.defaultBranch).to.equal(site.defaultBranch)
    expect(response.publicPreview).to.equal(site.publicPreview)

    expect(response.users.map(user => user.id))
      .to.have.members(site.Users.map(user => user.id))

    expect(response.builds).to.be.a("array")
    expect(response.siteRoot).to.be.a("string")
    expect(response.viewLink).to.be.a("string")
  }

  describe("GET /v0/site", () => {
    it("should require authentication", done => {
      factory.build().then(build => {
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
      githubAPINocks.repo()
      githubAPINocks.webhook()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it("should require authentication", done => {
      var cloneRequest = request("http://localhost:1337")
        .post(`/v0/site`)
        .send({
          organization: "partner-org",
          repository: "partner-site",
          defaultBranch: "master",
          engine: "jekyll"
        })
        .expect(403)

      cloneRequest.then(response => {
        validateAgainstJSONSchema("POST", "/site", 403, response.body)
        done()
      }).catch(done)
    })

    context("adding a site from a template", () => {
      it("should create a new site record for the given repository and add the user", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            template: "team",
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
        }).then(resp => {
          response = resp
          return Site.findById(response.body.id, { include: [ User ] })
        }).then(site => {
          validateAgainstJSONSchema("POST", "/site", 200, response.body)

          expect(site).to.have.property("owner", siteOwner)
          expect(site).to.have.property("repository", siteRepository)
          expect(site).to.have.property("defaultBranch", "master")
          expect(site).to.have.property("engine", "jekyll")
          expect(site).not.to.be.undefined
          expect(site.Users).to.have.length(1)
          expect(site.Users[0]).to.have.property("id", user.id)

          siteResponseExpectations(response.body, site)

          done()
        }).catch(done)
      })

      it("should use the current user as the owner if no owner is specified", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            template: "team",
            owner: null,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
        }).then(resp => {
          response = resp
          return Site.findById(response.body.id)
        }).then(site => {
          expect(site).to.have.property("owner", user.username)
          done()
        }).catch(done)
      })

      it("should trigger a build that pushes the source repo to the destiantion repo", done => {
        let user
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            template: "team",
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
        }).then(response => {
          return Site.findById(response.body.id, { include: [ Build ] })
        }).then(site => {
          expect(site.Builds).to.have.length(1)
          expect(site.Builds[0].user).to.equal(user.id)

          var buildSource = site.Builds[0].source

          const teamTemplate = sails.config.templates.team
          expect(buildSource).to.have.property("owner", teamTemplate.owner)
          expect(buildSource).to.have.property("repository", teamTemplate.repo)
          done()
        }).catch(done)
      })

      it("should create a webhook for the new site", done => {
        let user, webhookNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          nock.cleanAll()
          githubAPINocks.repo()
          webhookNock = githubAPINocks.webhook({
            accessToken: user.githubAccessToken,
            owner: siteOwner,
            repo: siteRepository,
          })

          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              template: "team",
              owner: siteOwner,
              repository: siteRepository,
              engine: "jekyll",
              defaultBranch: "18f-pages",
            })
            .set("Cookie", cookie)
            .expect(200)
        }).then(response => {
          expect(webhookNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })

      it("should respond with a 400 if no owner or repo is specified and not create a site", done => {
        let user

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              template: "team",
              engine: "jekyll",
              defaultBranch: "18f-pages",
              users: [user.id]
            })
            .set("Cookie", cookie)
            .expect(400)
        }).then(response => {
          return User.findById(user.id, { include: [ Site ] })
        }).then(user => {
          expect(user.Sites).to.have.length(0)
          done()
        }).catch(done)
      })

      it("should respond with a 400 if the owner has already added a site with the given repo / owner", done => {
        let site, user

        factory.site().then(site => {
          return Site.findById(site.id, { include: [ User ] })
        }).then(model => {
          site = model
          user = site.Users[0]

          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            template: "team",
            owner: site.owner,
            repository: site.repository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(400)
        }).then(response => {
          expect(response.body.message).to.equal("A site already exists for that owner / repository")
          done()
        }).catch(done)
      })
    })

    context("adding a new Federalist site from an existing GitHub repo", () => {
      it("should create a new Federalist site for the remote repository and add the user", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        githubAPINocks.repo()

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            owner: siteOwner,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
        }).then(resp => {
          response = resp
          return Site.findById(response.body.id, { include: [ User ] })
        }).then(site => {
          validateAgainstJSONSchema("POST", "/site", 200, response.body)

          expect(site).to.have.property("owner", siteOwner)
          expect(site).to.have.property("repository", siteRepository)
          expect(site).to.have.property("defaultBranch", "master")
          expect(site).to.have.property("engine", "jekyll")
          expect(site).not.to.be.undefined
          expect(site.Users).to.have.length(1)
          expect(site.Users[0]).to.have.property("id", user.id)

          siteResponseExpectations(response.body, site)

          done()
        }).catch(done)
      })

      it("should use the current user as the owner if no owner is specified", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            owner: null,
            repository: siteRepository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
        }).then(resp => {
          response = resp
          return Site.findById(response.body.id)
        }).then(site => {
          expect(site).to.have.property("owner", user.username)
          done()
        }).catch(done)
      })

      it("should trigger a build for the new site", done => {
        let user
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
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
          return Site.findById(response.body.id, { include: [ Build ] })
        }).then(site => {
          expect(site.Builds).to.have.length(1)
          expect(site.Builds[0].user).to.equal(user.id)
          done()
        }).catch(done)
      })

      it("should create a webhook for the new site", done => {
        let user, webhookNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          nock.cleanAll()
          githubAPINocks.repo()
          webhookNock = githubAPINocks.webhook({
            accessToken: user.githubAccessToken,
            owner: siteOwner,
            repo: siteRepository,
          })

          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              owner: siteOwner,
              repository: siteRepository,
              engine: "jekyll",
              defaultBranch: "18f-pages",
            })
            .set("Cookie", cookie)
            .expect(200)
        }).then(response => {
          expect(webhookNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })

      it("should respond with a 400 if no owner or repo is specified and not create a site", done => {
        let user

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              engine: "jekyll",
              defaultBranch: "18f-pages",
              users: [user.id]
            })
            .set("Cookie", cookie)
            .expect(400)
        }).then(response => {
          return User.findById(user.id, { include: [ Site ] })
        }).then(user => {
          expect(user.Sites).to.have.length(0)
          done()
        }).catch(done)
      })

      it("should render a 400 if the user does not have write access to the repository and not create a site", done => {
        let user, repoNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          nock.cleanAll()
          repoNock = githubAPINocks.repo({
            accessToken: user.accessToken,
            owner: siteOwner,
            repo: siteRepository,
            response: [200, { permissions: {
              push: false,
            }}],
          })
          githubAPINocks.webhook()

          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              owner: siteOwner,
              repository: siteRepository,
              engine: "jekyll",
              defaultBranch: "18f-pages",
            })
            .set("Cookie", cookie)
            .expect(400)
        }).then(response => {
          expect(repoNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })
    })

    context("adding an existing Federalist site from an existing GitHub repo", () => {
      it("should not create a new Federalist site for the remote repository", done => {
        let site, user

        factory.user().then(model => {
          user = model
          return factory.site()
        }).then(site => {
          return Site.findById(site.id)
        }).then(model => {
          site = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            owner: site.owner,
            repository: site.repository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(200)
        }).then(response => {
          validateAgainstJSONSchema("POST", "/site", 200, response.body)
          return Site.findAll({ where: { owner: site.owner, repository: site.repository } })
        }).then(sites => {
          expect(sites.length).to.equal(1)
          done()
        }).catch(done)
      })

      it("should not trigger a build for the existing site", done => {
        let user, site
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return factory.site({ owner: siteOwner, repository: siteRepository })
        }).then(model => {
          site = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
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
          return Site.findById(site.id, { include: [ Build ] })
        }).then(site => {
          expect(site.Builds).to.have.length(0)
          done()
        }).catch(done)
      })

      it("should add the user to the existing site", done => {
        let user, site
        let siteOwner = crypto.randomBytes(3).toString("hex")
        let siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return factory.site({ owner: siteOwner, repository: siteRepository })
        }).then(model => {
          site = model
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              owner: siteOwner,
              repository: siteRepository,
              engine: "jekyll",
              defaultBranch: "18f-pages",
            })
            .set("Cookie", cookie)
            .expect(200)
        }).then(response => {
          expect(response.body).to.have.property("id", site.id)
          return Site.findById(site.id, { include: [ User ] })
        }).then(site => {
          expect(site.Users).to.have.length(2)
          expect(site.Users.map(user => user.id)).to.contain(user.id)
          done()
        }).catch(done)
      })

      it("should attempt to create a webhook for a new site, and hanlde the error b/c one exists already", done => {
        let user, webhookNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory.user().then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          nock.cleanAll()
          githubAPINocks.repo()
          webhookNock = githubAPINocks.webhook({
            accessToken: user.accessToken,
            owner: siteOwner,
            repo: siteRepository,
            response: [400, {
              errors: [{ message: "Hook already exists on this repository" }]
            }]
          })

          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              owner: siteOwner,
              repository: siteRepository,
              engine: "jekyll",
              defaultBranch: "18f-pages",
            })
            .set("Cookie", cookie)
            .expect(200)
        }).then(response => {
          expect(webhookNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })

      it("should render a 400 if the user does not have write access to the repository and not create a site", done => {
        let user, site, repoNock

        factory.site().then(model => {
          site = model
          return factory.user()
        }).then(model => {
          user = model
          return session(user)
        }).then(cookie => {
          nock.cleanAll()
          repoNock = githubAPINocks.repo({
            accessToken: user.accessToken,
            owner: site.owner,
            repo: site.repository,
            response: [200, { permissions: {
              push: false,
            }}],
          })
          githubAPINocks.webhook()

          return request("http://localhost:1337")
            .post("/v0/site")
            .send({
              owner: site.owner,
              repository: site.repository,
              engine: "jekyll",
              defaultBranch: "18f-pages",
            })
            .set("Cookie", cookie)
            .expect(400)
        }).then(response => {
          expect(repoNock.isDone()).to.equal(true)
          done()
        }).catch(done)
      })

      it("should respond with a 400 if the owner has already added a site with the given repo / owner", done => {
        let site, user

        factory.site().then(site => {
          return Site.findById(site.id, { include: [ User ] })
        }).then(model => {
          site = model
          user = site.Users[0]

          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
          .post(`/v0/site`)
          .send({
            owner: site.owner,
            repository: site.repository,
            defaultBranch: "master",
            engine: "jekyll"
          })
          .set("Cookie", cookie)
          .expect(400)
        }).then(response => {
          expect(response.body.message).to.equal("You've already added this site to Federalist")
          done()
        }).catch(done)
      })
    })
  })

  describe("DELETE /v0/site/:id", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
  })

  describe("PUT /v0/site/:id", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request("http://localhost:1337")
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

      factory.site({ config: "old-config" }).then(site => {
        return Site.findById(site.id, { include: [ User ] })
      }).then(model => {
        site = model
        return session(site.Users[0])
      }).then(cookie => {
        return request("http://localhost:1337")
          .put(`/v0/site/${site.id}`)
          .send({
            config: "new-config"
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(resp => {
        response = resp
        return Site.findById(site.id, { include: [ User ] })
      }).then(site => {
        validateAgainstJSONSchema("PUT", "/site/{id}", 200, response.body)

        expect(response.body).to.have.property("config", "new-config")
        expect(site).to.have.property("config", "new-config")
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
        return request("http://localhost:1337")
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
        return request("http://localhost:1337")
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
        done()
      }).catch(done)
    })
  })
})
