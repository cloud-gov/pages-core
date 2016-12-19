var expect = require("chai").expect
var factory = require("../../support/factory")

describe("BuildLog", () => {
  describe(".afterValidate", () => {
    it("should filter secrets that appear in the output", done => {
      let build, unfilteredOutput

      factory(Build).then(model => {
        build = model
        return Site.findOne(build.site).populate("users")
      }).then(site => {
        user = site.users[0]
        unfilteredOutput = `${sails.config.s3.accessKeyId} ${sails.config.s3.secretAccessKey} ${sails.config.build.token} ${user.githubAccessToken}`
        return BuildLog.create({
          build: build,
          output: unfilteredOutput,
          source: "publish.sh",
        })
      }).then(build => {
        expect(build.output).to.equal(Array(4).fill("[FILTERED]").join(" "))
        done()
      })
    })
  })
})
