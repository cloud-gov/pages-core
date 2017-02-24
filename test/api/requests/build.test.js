const expect = require("chai").expect
const request = require("supertest-as-promised")
const sinon = require("sinon")
const factory = require("../support/factory")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")

describe("Build API", () => {
  var buildResponseExpectations = (response, build) => {
    if (build.completedAt) {
      expect(build.completedAt.toISOString()).to.equal(response.completedAt)
    } else {
      expect(response.completedAt).to.be.undefined
    }
    expect(build.error == response.error).to.be.ok
    expect(build.branch == response.branch).to.be.ok
    expect(response.site.id).to.equal(build.site || build.Site.id)
    expect(response.user.id).to.equal(build.user || build.User.id)
    expect(response.buildLogs).to.be.undefined
  }

  describe("POST /v0/build", () => {
    it("should require authentication", done => {
      factory.site().then(site => {
        return request("http://localhost:1337")
          .post(`/v0/build/`)
          .send({
            site: site.id,
            branch: "my-branch"
          })
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build", 403, response.body)
        done()
      }).catch(done)
    })

    it("should create a build with the given site and branch for the current user", done => {
      let site, user

      const userPromise = factory.user()
      const sitePromise = factory.site({ users: Promise.all([userPromise]) })
      const cookiePromise = session(userPromise)

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      }).then(promisedValues => {
        site = promisedValues.site
        user = promisedValues.user

        return request("http://localhost:1337")
          .post(`/v0/build/`)
          .send({
            site: site.id,
            branch: "my-branch"
          })
          .set("Cookie", promisedValues.cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build", 200, response.body)
        return Build.findOne({
          where: {
            site: site.id,
            user: user.id,
            branch: "my-branch",
          }
        })
      }).then(build => {
        expect(build).not.to.be.undefined
        done()
      }).catch(done)
    })

    it("should render a 403 if the user is not associated with the given site", done => {
      Promise.props({
        site: factory.site(),
        cookie: session(),
      }).then(({ site, cookie }) => {
        return request("http://localhost:1337")
          .post(`/v0/build/`)
          .send({
            site: site.id,
            branch: "my-branch"
          })
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build", 403, response.body)
        done()
      }).catch(done)
    })
  })

  describe("GET /v0/build/:id", () => {
    it("should require authentication", done => {
      factory.build().then(build => {
        return request("http://localhost:1337")
          .get(`/v0/build/${build.id}`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{id}", 403, response.body)
        done()
      }).catch(done)
    })

    it("should return a JSON representation of the build", done => {
      var build
      var buildAttributes = {
        error: "message",
        state: "error",
        branch: "18f-pages",
        completedAt: new Date()
      }

      factory.build(buildAttributes).then(model => {
        build = model
        return session(
          User.findById(build.user)
        )
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/build/${build.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        buildResponseExpectations(response.body, build)
        validateAgainstJSONSchema("GET", "/build/{id}", 200, response.body)
        done()
      }).catch(done)
    })

    it("should respond with a 403 if the current user is not associated with the build", done => {
      var build

      factory.build().then(model => {
        build = model
        return session(factory.user())
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/build/${build.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{id}", 403, response.body)
        done()
      }).catch(done)
    })
  })

  describe("GET /v0/build", () => {
    it("should require authentication", done => {
      factory.build().then(build => {
        return request("http://localhost:1337")
          .get("/v0/build")
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build", 403, response.body)
        done()
      }).catch(done)
    })

    it("should list builds for sites associated with the current user", done => {
      var user, builds

      factory.user().then(model => {
        user = model
        var buildPromises = Array(3).fill(0).map(() => {
          return factory.build({ user: user.id })
        })
        return Promise.all(buildPromises)
      }).then(models => {
        builds = models
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get("/v0/build")
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(response.body).to.be.a("Array")
        expect(response.body).to.have.length(3)
        builds.forEach(build => {
          const responseBuild = response.body.find(candidate => {
            return candidate.id === build.id
          })
          expect(responseBuild).not.to.be.undefined
          buildResponseExpectations(responseBuild, build)
        })
        validateAgainstJSONSchema("GET", "/build", 200, response.body)
        done()
      }).catch(done)
    })

    it("should not show a user any builds not associated with their sites", done => {
      var user

      factory.user().then(model => {
        user = model
        var buildPromises = Array(3).fill(0).map(() => {
          return factory.build
        })
        return Promise.all(buildPromises)
      }).then(builds => {
        expect(builds).to.have.length(3)
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get("/v0/build")
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(response.body).to.be.a("array")
        expect(response.body).to.be.empty
        done()
      }).catch(done)
    })
  })

  describe("POST /v0/build/:id/status/:token", () => {
    var postBuildStatus = (options) => {
      const buildToken = options.buildToken || options.build.token

      return request("http://localhost:1337")
        .post(`/v0/build/${options.build.id}/status/${buildToken}`)
        .type("json")
        .send({
          status: options["status"],
          message: encode64(options["message"])
        })
    }

    var encode64 = (str) => {
      return new Buffer(str, 'utf8').toString('base64');
    }

    it("should mark a build successful if status is 0 and message is blank", done => {
      var build

      factory.build().then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          build: build,
          status: "0",
          message: ""
        }).expect(200)
      }).then(response => {
        return Build.findById(build.id)
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("success")
        expect(build.error).to.equal("")
        expect(new Date() - build.completedAt).to.be.below(1000)
        done()
      }).catch(done)
    })

    it("should mark a build errored if the status is non-zero and should set the message", done => {
      var build

      factory.build().then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          build: build,
          status: "1",
          message: "The build failed for a reason"
        }).expect(200)
      }).then(response => {
        return Build.findById(build.id)
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("error")
        expect(build.error).to.equal("The build failed for a reason")
        expect(new Date() - build.completedAt).to.be.below(1000)
        done()
      }).catch(done)
    })

    it("should respond with a 404 for a build that does not exist", done => {
      postBuildStatus({
        build: { id: "invalid-build-id", token: "invalid-token" },
        status: "0",
        message: ""
      }).expect(404, done)
    })

    it("should respond with a 403 and not modify the build for an invalid build token", done => {
      var build

      factory.build().then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          build: build,
          buildToken: "invalid-token",
          status: "0",
          message: ""
        }).expect(403)
      }).then(response => {
        return Build.findById(build.id)
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("processing")
        done()
      }).catch(done)
    })
  })
})
