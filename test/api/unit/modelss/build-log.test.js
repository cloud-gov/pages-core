const expect = require("chai").expect

const factory = require("../../support/factory")

describe("BuildLog model", () => {
  describe("before validate hook", () => {
    it("should sanitize secrets in the log output", done => {
      let user = factory.user()
      let build = factory.build({ user })

      Promise.props({ user, build }).then(({ user, build }) => {
        return BuildLog.create({
          build: build.id,
          source: "publish.sh",
          output: `${sails.config.s3.accessKeyId} ${sails.config.s3.secretAccessKey} ${sails.config.build.token} ${user.githubAccessToken}`
        })
      }).then(buildLog => {
        expect(buildLog.output).to.equal(Array(4).fill("[FILTERED]").join(" "))
        done()
      }).catch(done)
    })
  })
})
