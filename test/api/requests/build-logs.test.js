const expect = require("chai").expect
const request = require("supertest-as-promised")
const factory = require("../support/factory")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")

describe("Build Log API", () => {
  describe("POST /v0/build/:build_id/log/:token", () => {
    it("should create a build log with the given params", done => {
      let build

      factory(Build).then(model => {
        build = model

        return request("localhost:1337")
          .post(`/v0/build/${build.id}/log/${build.token}`)
          .type("json")
          .send({
            source: "build.sh",
            output: "This is the output for build.sh",
          })
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build/{build_id}/log/{token}", 200, response.body)

        expect(response.body).to.have.property("source", "build.sh")
        expect(response.body).to.have.property("output", "This is the output for build.sh")

        return BuildLog.find({ build: build.id })
      }).then(logs => {
        expect(logs).to.have.length(1)
        expect(logs[0]).to.have.property("source", "build.sh")
        expect(logs[0]).to.have.property("output", "This is the output for build.sh")
        done()
      })
    })

    it("should respond with a 403 and not create a build log for an invalid build token", done => {
      let build

      factory(Build).then(model => {
        build = model

        return request("localhost:1337")
          .post(`/v0/build/${build.id}/log/invalid-token`)
          .type("json")
          .send({
            source: "build.sh",
            body: "This is the output for build.sh",
          })
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty

        return BuildLog.find({ build: build.id })
      }).then(logs => {
        expect(logs).to.be.empty
        done()
      })
    })

    it("should respond with a 404 if no build is found for the given id", done => {
      request("localhost:1337")
        .post(`/v0/build/fake-id/log/fake-build-token`)
        .type("json")
        .send({
          source: "build.sh",
          body: "This is the output for build.sh",
        })
        .expect(404, done)
    })
  })

  describe("GET /v0/build/:build_id/log", () => {
    it("should require authentication", done => {
      factory(BuildLog).then(buildLog => {
        return request("http://localhost:1337")
          .get(`/v0/build/${buildLog.build}/log`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should render builds logs for the given build", done => {
      let build

      factory(Build).then(model => {
        build = model

        return Promise.all(Array(3).fill(0).map(() => {
          factory(BuildLog, {
            build: build,
          })
        }))
      }).then(models => {
        return Site.findOne({ id: build.site }).populate("users")
      }).then(site => {
        let user = site.users[0]
        return session(user)
      }).then(cookie => {
        return request("localhost:1337")
          .get(`/v0/build/${build.id}/log`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{build_id}/log", 200, response.body)
        expect(response.body).to.be.a("array")
        expect(response.body).to.have.length(3)
        done()
      })
    })

    it("should respond with a 403 if the given build is not associated with one of the user's sites", done => {
      let build

      factory(Build).then(model => {
        build = model

        return Promise.all(Array(3).fill(0).map(() => factory(BuildLog)))
      }).then(models => {
        return factory(User)
      }).then(user => {
        return session(user)
      }).then(cookie => {
        return request("localhost:1337")
          .get(`/v0/build/${build.id}/log`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })
  })
})
