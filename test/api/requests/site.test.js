const crypto = require("crypto")
var expect = require("chai").expect
var nock = require("nock")
var request = require("supertest-as-promised")
var sinon = require("sinon")

var factory = require("../support/factory")
var githubAPINocks = require("../support/githubAPINocks")
var session = require("../support/session")

describe("Site API", () => {
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
        expect(response.body).to.be.empty
        done()
      })
    })

    context("adding a site from a template", () => {
      it("should create a new site record for the given repository and add the user", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
          return Site.findOne({ id: response.body.id }).populate("users")
        }).then(site => {
          expect(site).to.have.property("owner", siteOwner)
          expect(site).to.have.property("repository", siteRepository)
          expect(site).to.have.property("defaultBranch", "master")
          expect(site).to.have.property("engine", "jekyll")
          expect(site).not.to.be.undefined
          expect(site.users).to.have.length(1)
          expect(site.users[0]).to.have.property("id", user.id)

          siteResponseExpectations(response.body, site)

          done()
        })
      })

      it("should use the current user as the owner if no owner is specified", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
          return Site.findOne({ id: response.body.id }).populate("users")
        }).then(site => {
          expect(site).to.have.property("owner", user.username)
          done()
        })
      })

      it("should trigger a build that pushes the source repo to the destiantion repo", done => {
        let user
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
          return Site.findOne({ id: response.body.id }).populate("builds")
        }).then(site => {
          expect(site.builds).to.have.length(1)
          expect(site.builds[0].user).to.equal(user.id)

          var buildSource = site.builds[0].source

          const teamTemplate = sails.config.templates.team
          expect(buildSource).to.have.property("owner", teamTemplate.owner)
          expect(buildSource).to.have.property("repository", teamTemplate.repo)
          done()
        })
      })

      it("should create a webhook for the new site", done => {
        let user, webhookNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
        })
      })

      it("should respond with a 400 if no owner or repo is specified and not create a site", done => {
        let user

        factory(User).then(model => {
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
          return Site.find({ user: user.id })
        }).then(sites => {
          expect(sites).to.have.length(0)
          done()
        })
      })

      it("should respond with a 400 if the owner has already added a site with the given repo / owner", done => {
        let site, user

        factory(Site).then(site => {
          return Site.findOne(site.id).populate("users")
        }).then(model => {
          site = model
          user = site.users[0]

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
        })
      })
    })

    context("adding a new Federalist site from an existing GitHub repo", () => {
      it("should create a new Federalist site for the remote repository and add the user", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        githubAPINocks.repo()

        factory(User).then(model => {
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
          return Site.findOne({ id: response.body.id }).populate("users")
        }).then(site => {
          expect(site).to.have.property("owner", siteOwner)
          expect(site).to.have.property("repository", siteRepository)
          expect(site).to.have.property("defaultBranch", "master")
          expect(site).to.have.property("engine", "jekyll")
          expect(site).not.to.be.undefined
          expect(site.users).to.have.length(1)
          expect(site.users[0]).to.have.property("id", user.id)

          siteResponseExpectations(response.body, site)

          done()
        })
      })

      it("should use the current user as the owner if no owner is specified", done => {
        let user, response
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
          return Site.findOne({ id: response.body.id }).populate("users")
        }).then(site => {
          expect(site).to.have.property("owner", user.username)
          done()
        })
      })

      it("should trigger a build for the new site", done => {
        let user
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
          return Site.findOne({ id: response.body.id }).populate("builds")
        }).then(site => {
          expect(site.builds).to.have.length(1)
          expect(site.builds[0].user).to.equal(user.id)
          done()
        })
      })

      it("should create a webhook for the new site", done => {
        let user, webhookNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
        })
      })

      it("should respond with a 400 if no owner or repo is specified and not create a site", done => {
        let user

        factory(User).then(model => {
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
          return Site.find({ user: user.id })
        }).then(sites => {
          expect(sites).to.have.length(0)
          done()
        })
      })

      it("should render a 400 if the user does not have write access to the repository and not create a site", done => {
        let user, repoNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
        })
      })
    })

    context("adding an existing Federalist site from an existing GitHub repo", () => {
      it("should not create a new Federalist site for the remote repository", done => {
        let site, user

        factory(User).then(model => {
          user = model
          return factory(Site)
        }).then(site => {
          return Site.findOne(site.id).populate("users")
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
          return Site.find({ owner: site.owner, repository: site.repository })
        }).then(sites => {
          expect(sites.length).to.equal(1)
          done()
        })
      })

      it("should not trigger a build for the existing site", done => {
        let user, site
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
          user = model
          return factory(Site, { owner: siteOwner, repository: siteRepository })
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
          return Site.findOne(site.id).populate("builds")
        }).then(site => {
          expect(site.builds).to.have.length(0)
          done()
        })
      })

      it("should add the user to the existing site", done => {
        let user, site
        let siteOwner = crypto.randomBytes(3).toString("hex")
        let siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
          user = model
          return factory(Site, { owner: siteOwner, repository: siteRepository })
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
          return Site.findOne({ id: site.id }).populate("users")
        }).then(site => {
          expect(site.users).to.have.length(2)
          expect(site.users.map(user => user.id)).to.contain(user.id)
          done()
        })
      })

      it("should attempt to create a webhook for a new site, and hanlde the error b/c one exists already", done => {
        let user, webhookNock
        const siteOwner = crypto.randomBytes(3).toString("hex")
        const siteRepository = crypto.randomBytes(3).toString("hex")

        factory(User).then(model => {
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
        })
      })

      it("should render a 400 if the user does not have write access to the repository and not create a site", done => {
        let user, site, repoNock

        factory(Site).then(model => {
          site = model
          return factory(User)
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
        })
      })

      it("should respond with a 400 if the owner has already added a site with the given repo / owner", done => {
        let site, user

        factory(Site).then(site => {
          return Site.findOne(site.id).populate("users")
        }).then(model => {
          site = model
          user = site.users[0]

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
        })
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
        expect(site.builds).to.have.length(0)
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
        expect(site.builds).to.have.length(1)
        done()
      })
    })
  })
})
