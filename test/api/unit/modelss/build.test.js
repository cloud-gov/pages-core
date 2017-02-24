const expect = require("chai").expect

const factory = require("../../support/factory")

describe("Build model", () => {
  describe("before validate hook", () => {
    it("should add a build token", done => {
      let build

      factory.site().then(site => {
        build = Build.build({
          site: site.id,
        })
        return build.validate()
      }).then(() => {
        expect(build.token).to.be.okay
        done()
      }).catch(done)
    })

    it("should not override a build token if one exists", done => {
      let build

      factory.site().then(site => {
        build = Build.build({
          site: site.id,
          token: "123abc"
        })
        return build.validate()
      }).then(() => {
        expect(build.token).to.equal("123abc")
        done()
      }).catch(done)
    })
  })

  describe("after create hook", () => {
    it("should send a build new build message", done => {
      const oldSendMessage = SQS.sqsClient.sendMessage
      SQS.sqsClient.sendMessage = (params, callback) => {
        SQS.sqsClient.sendMessage = oldSendMessage
        done()
      }
      factory.build().catch(done)
    })
  })

  describe(".completeJob(message)", () => {
    it("should mark a build successful if there is no error", done => {
      factory.build().then(build => {
        return build.completeJob()
      }).then(build => {
        expect(build.state).to.equal("success")
        expect(build.error).to.equal("")
        expect(new Date() - build.completedAt).to.be.below(1000)
        done()
      }).catch(done)
    })

    it("should mark a build errored with a message if the error is a string", done => {
      factory.build().then(build => {
        return build.completeJob("this is an error")
      }).then(build => {
        expect(build.state).to.equal("error")
        expect(build.error).to.equal("this is an error")
        done()
      }).catch(done)
    })

    it("should mark a build errored with the error's message if the error is an error object", done => {
      factory.build().then(build => {
        const error = new Error("this is an error")
        return build.completeJob(error)
      }).then(build => {
        expect(build.state).to.equal("error")
        expect(build.error).to.equal("this is an error")
        done()
      }).catch(done)
    })

    it("should sanitize GitHub access tokens from error message", done => {
      factory.build().then(build => {
        return build.completeJob("http://123abc@github.com")
      }).then(build => {
        expect(build.state).to.equal("error")
        expect(build.error).not.to.match(/123abc/)
        done()
      }).catch(done)
    })
  })

  it("should require a site object before saving", done => {
    factory.user().then(user => {
      return Build.create({
        user: user.id,
        site: null,
      })
    }).then(() => {
      done(new Error("Excepted a validation error"))
    }).catch(err => {
      expect(err.name).to.equal("SequelizeValidationError")
      expect(err.errors[0].path).to.equal("site")
      done()
    }).catch(done)
  })

  it("should require a user object before saving", done => {
    factory.user().then(user => {
      return Build.create({
        user: null,
        site: user.id,
      })
    }).then(() => {
      done(new Error("Excepted a validation error"))
    }).catch(err => {
      expect(err.name).to.equal("SequelizeValidationError")
      expect(err.errors[0].path).to.equal("user")
      done()
    }).catch(done)
  })
})
