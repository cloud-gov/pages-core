var expect = require("chai").expect
var request = require("supertest-as-promised")
var sinon = require("sinon")
var factory = require("../factory")

var postBuildStatus = (options) => {
  buildToken = options["buildToken"] || sails.config.build.token

  return request("http://localhost:1337")
    .post(`/build/status/${options["buildID"]}/${buildToken}`)
    .type("json")
    .send({
      status: options["status"],
      message: encode64(options["message"])
    })
}

var encode64 = (str) => {
  return new Buffer(str, 'utf8').toString('base64');
}

describe("Build API", () => {
  describe("POST /build/status/:id/:token", () => {
    beforeEach(() => {
      sinon.stub(Site, "registerSite", (_, done) => done())
    })

    afterEach(() => {
      Site.registerSite.restore()
    })

    it("should mark a build successful if status is 0 and message is blank", done => {
      var build

      factory(Build).then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          buildID: build.id,
          status: "0",
          message: ""
        }).expect(200)
      }).then(request => {
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
          buildID: build.id,
          status: "1",
          message: "The build failed for a reason"
        }).expect(200)
      }).then(request => {
        return Build.findOne({ id: build.id })
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("error")
        expect(build.error).to.equal("The build failed for a reason")
        done()
      })
    })

    it("should respond with a 200 for a build that does not exist", done => {
      postBuildStatus({
        buildID: "invalid-build-id",
        status: "0",
        message: ""
      }).expect(200, done)
    })

    it("should respond with a 400 and not modify the build for an invalid build token", done => {
      var build

      factory(Build).then(model => {
        build = model
      }).then(() => {
        return postBuildStatus({
          buildID: build.id,
          buildToken: "invalid-token",
          status: "0",
          message: ""
        }).expect(400)
      }).then(request => {
        return Build.findOne({ id: build.id })
      }).then(build => {
        expect(build).to.not.be.undefined
        expect(build.state).to.equal("processing")
        done()
      })
    })
  })
})
