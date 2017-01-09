const expect = require("chai").expect
const request = require("supertest-as-promised")
const sinon = require("sinon")
const factory = require("../support/factory")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")

describe("Build API", () => {
  var buildResponseExpectations = (response, build) => {
    Object.keys(build).forEach(key => {
      if (key === "buildLogs") return;

      expect(response[key]).to.not.be.undefined
      if (typeof build[key] === "number" && typeof response[key] === "object") {
        expect(response[key].id).to.equal(build[key])
      } else if (build[key] && build[key].toISOString) {
        expect(response[key]).to.equal(build[key].toISOString())
      } else {
        expect(response[key]).to.equal(build[key])
      }
    })
  }

  describe("GET /v0/build/:id", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .get(`/v0/build/${build.id}`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{id}", 403, response.body)
        done()
      })
    })

    it("should return a JSON representation of the build", done => {
      var build
      var buildAttributes = {
        error: "message",
        state: "error",
        branch: "18f-pages",
        completedAt: new Date()
      }

      factory(Build, buildAttributes).then(model => {
        build = model
        return session(
          User.findOne({ id: build.user })
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
      })
    })

    it("should respond with a 403 if the current user is not associated with the build", done => {
      var build

      factory(Build).then(model => {
        build = model
        return session(factory(User))
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/build/${build.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{id}", 403, response.body)
        done()
      })
    })
  })

  describe("GET /v0/build", () => {
    it("should require authentication", done => {
      factory(Build).then(build => {
        return request("http://localhost:1337")
          .get("/v0/build")
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build", 403, response.body)
        done()
      })
    })

    it("should list builds for sites associated with the current user", done => {
      var user, builds

      factory(User).then(model => {
        user = model
        var buildPromises = Array(3).fill(0).map(() => {
          return factory(Build, { user: user.id })
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
        builds.forEach((build, index) => {
          buildResponseExpectations(response.body[index], build)
        })
        validateAgainstJSONSchema("GET", "/build", 200, response.body)
        done()
      })
    })

    it("should not show a user any builds not associated with their sites", done => {
      var user

      factory(User).then(model => {
        user = model
        var buildPromises = Array(3).fill(0).map(() => {
          return factory(Build)
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
      })
    })
  })

  describe("POST /build/:id/restart", () => {
    context("On the default branch", () => {
      it("should create a build that mirrors the original", done => {
        let build

        factory(Build, { branch: undefined }).then(model => {
          build = model
          return User.findOne(build.user)
        }).then(user => {
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
            .post(`/v0/build/${build.id}/restart`)
            .set("Cookie", cookie)
            .expect(200)
        }).then(response => {
          return Build.find({
            user: build.user,
            site: build.site,
            branch: build.branch,
          })
        }).then(builds => {
          expect(builds).to.have.length(2)
          done()
        })
      })
    })

    context("On a preview branch", () => {
      it("should create a build that mirrors the original", done => {
        let build

        factory(Build, { branch: "preview" }).then(model => {
          build = model
          return User.findOne(build.user)
        }).then(user => {
          return session(user)
        }).then(cookie => {
          return request("http://localhost:1337")
            .post(`/v0/build/${build.id}/restart`)
            .set("Cookie", cookie)
            .expect(200)
        }).then(response => {
          return Build.find({
            user: build.user,
            site: build.site,
            branch: build.branch,
          })
        }).then(builds => {
          expect(builds).to.have.length(2)
          done()
        })
      })
    })

    it("should render a JSON representation of the new build", done => {
      let build, response

      factory(Build).then(model => {
        build = model
        return User.findOne(build.user)
      }).then(user => {
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post(`/v0/build/${build.id}/restart`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(res => {
        response = res

        return Build.find({
          user: build.user,
          site: build.site,
        }).sort("createdAt DESC")
      }).then(builds => {
        buildResponseExpectations(response.body, builds[0])
        validateAgainstJSONSchema("POST", "/build/{id}/restart", 200, response.body)
        done()
      })
    })

    it("should restart the build if the user did not create the build, but is associated with the build's site", done => {
      var build, user

      factory(User).then(model => {
        user = model
        return factory(Build)
      }).then(model => {
        build = model
        return Site.findOne(build.site)
      }).then(site => {
        site.users.add(user.id)
        return site.save()
      }).then(result => {
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post(`/v0/build/${build.id}/restart`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        return Build.find({
          user: [build.user, user.id],
          site: build.site,
        })
      }).then(builds => {
        expect(builds).to.have.length(2)
        done()
      })
    })

    it("should respond with a 403 if the user is not associated with the build's site", done => {
      let build

      factory(Build).then(model => {
        build = model
        return session(factory(User))
      }).then(cookie => {
        return request("http://localhost:1337")
          .post(`/v0/build/${build.id}/restart`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(() => done())
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

      factory(Build).then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          build: build,
          status: "0",
          message: ""
        }).expect(200)
      }).then(response => {
        return Build.findOne({ id: build.id })
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("success")
        expect(build.error).to.equal("")
        done()
      })
    })

    it("should mark a build errored if the status is non-zero and should set the message", done => {
      var build

      factory(Build).then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          build: build,
          status: "1",
          message: "The build failed for a reason"
        }).expect(200)
      }).then(response => {
        return Build.findOne({ id: build.id })
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("error")
        expect(build.error).to.equal("The build failed for a reason")
        done()
      })
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

      factory(Build).then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          build: build,
          buildToken: "invalid-token",
          status: "0",
          message: ""
        }).expect(403)
      }).then(response => {
        return Build.findOne({ id: build.id })
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("processing")
        done()
      })
    })
  })
})
