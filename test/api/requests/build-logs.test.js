const expect = require("chai").expect
const request = require("supertest")
const app = require("../../../app")
const factory = require("../support/factory")
const session = require("../support/session")
const validateAgainstJSONSchema = require("../support/validateAgainstJSONSchema")
const { BuildLog, Site, User } = require("../../../api/models")

describe("Build Log API", () => {
  describe("POST /v0/build/:build_id/log/:token", () => {
    const encode64 = (str) => {
      return new Buffer(str, 'utf8').toString('base64');
    }

    it("should create a build log with the given params", done => {
      let build

      factory.build().then(model => {
        build = model

        return request(app)
          .post(`/v0/build/${build.id}/log/${build.token}`)
          .type("json")
          .send({
            source: "build.sh",
            output: encode64("This is the output for build.sh"),
          })
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build/{build_id}/log/{token}", 200, response.body)

        expect(response.body).to.have.property("source", "build.sh")
        expect(response.body).to.have.property("output", "This is the output for build.sh")

        return BuildLog.findAll({ where: { build: build.id } })
      }).then(logs => {
        expect(logs).to.have.length(1)
        expect(logs[0]).to.have.property("source", "build.sh")
        expect(logs[0]).to.have.property("output", "This is the output for build.sh")
        done()
      }).catch(done)
    })

    it("should respond with a 400 if the params are not correct", done => {
      factory.build().then(build => {
        return request(app)
          .post(`/v0/build/${build.id}/log/${build.token}`)
          .type("json")
          .send({
            src: "build.sh",
            otpt: encode64("This is the output for build.sh"),
          })
          .expect(400)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build/{build_id}/log/{token}", 400, response.body)
        done()
      }).catch(done)
    })

    it("should respond with a 403 and not create a build log for an invalid build token", done => {
      let build

      factory.build().then(model => {
        build = model

        return request(app)
          .post(`/v0/build/${build.id}/log/invalid-token`)
          .type("json")
          .send({
            source: "build.sh",
            output: encode64("This is the output for build.sh"),
          })
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("POST", "/build/{build_id}/log/{token}", 403, response.body)

        return BuildLog.findAll({ where: { build: build.id } })
      }).then(logs => {
        expect(logs).to.be.empty
        done()
      }).catch(done)
    })

    it("should respond with a 404 if no build is found for the given id", done => {
      const buildLogRequest = request(app)
        .post(`/v0/build/fake-id/log/fake-build-token`)
        .type("json")
        .send({
          source: "build.sh",
          output: encode64("This is the output for build.sh"),
        })
        .expect(404)

      buildLogRequest.then(response => {
        validateAgainstJSONSchema("POST", "/build/{build_id}/log/{token}", 404, response.body)
        done()
      }).catch(done)
    })
  })

  describe("GET /v0/build/:build_id/log", () => {
    it("should require authentication", done => {
      factory.buildLog().then(buildLog => {
        return request(app)
          .get(`/v0/build/${buildLog.build}/log`)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{build_id}/log", 403, response.body)
        done()
      }).catch(done)
    })

    it("should render builds logs for the given build", done => {
      let build

      factory.build().then(model => {
        build = model

        return Promise.all(Array(3).fill(0).map(() => {
          factory.buildLog({
            build: build,
          })
        }))
      }).then(models => {
        return Site.findById(build.site, { include: [User] })
      }).then(site => {
        let user = site.Users[0]
        return session(user)
      }).then(cookie => {
        return request(app)
          .get(`/v0/build/${build.id}/log`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{build_id}/log", 200, response.body)
        expect(response.body).to.be.a("array")
        expect(response.body).to.have.length(3)
        done()
      }).catch(done)
    })

    it("should respond with a 403 if the given build is not associated with one of the user's sites", done => {
      let build

      factory.build().then(model => {
        build = model

        return Promise.all(Array(3).fill(0).map(() => factory.buildLog()))
      }).then(models => {
        return factory.user()
      }).then(user => {
        return session(user)
      }).then(cookie => {
        return request(app)
          .get(`/v0/build/${build.id}/log`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{build_id}/log", 403, response.body)
        done()
      }).catch(done)
    })

    it("should response with a 404 if the given build does not exist", done => {
      session().then(cookie => {
        return request(app)
          .get(`/v0/build/fake-id/log`)
          .set("Cookie", cookie)
          .expect(404)
      }).then(response => {
        validateAgainstJSONSchema("GET", "/build/{build_id}/log", 404, response.body)
        done()
      }).catch(done)
    })
  })
})
