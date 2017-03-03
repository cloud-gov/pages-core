const expect = require("chai").expect
const factory = require("../../support/factory")
const { BuildLog } = require("../../../../api/models")

describe("BuildLog model", () => {
  describe("before validate hook", () => {
    it("should sanitize secrets in the log output", done => {
      let user = factory.user()
      let build = factory.build({ user })

      Promise.props({ user, build }).then(({ user, build }) => {
        return BuildLog.create({
          build: build.id,
          source: "publish.sh",
          output: `${config.s3.accessKeyId} ${config.s3.secretAccessKey} ${config.build.token} ${user.githubAccessToken}`
        })
      }).then(buildLog => {
        expect(buildLog.output).to.equal(Array(4).fill("[FILTERED]").join(" "))
        done()
      }).catch(done)
    })
  })
})
