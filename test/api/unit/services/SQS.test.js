var AWS = require('aws-sdk-mock')
var expect = require("chai").expect
var sinon = require("sinon")
var factory = require("../../support/factory")

describe("SQS", () => {
  before(() => {
    sinon.stub(GitHub, "setWebhook", (_, __, done) => done())
  })

  after(() => {
    GitHub.setWebhook.restore()
  })

  describe(".sendBuildMessage(build)", () => {
    it("should send a formatted build message")
  })

  describe(".formatBuildMessage(build)", () => {
    it("should set the correct AWS credentials in the message")
    it("should set CALLBACK in the message")

    context("building a site's default branch", () => {
      it("should set an empty string for BASE_URL in the message for a site with a custom domain")
      it("it should set BASE_URL in the message for a site without a custom domain")
      it("should set PREFIX in the message to /site/:owner/:repo/")
    })

    context("building a site's preview branch", () => {
      it("should set BASE_URL in the message for a site with a custom domain")
      it("should set BASE_URL in the message for a site without a custom domain")
      it("should set PREFIX in the message to /preview/:owner/:repo/:branch")
    })

    it("should set CACHE_CONTROL in the message")
    it("should set BRANCH in the message to the name build's branch")
    it("should set CONFIG in the message to the YAML config for the site")
    it("should set REPOSITORY in the message to the site's repo name")
    it("should set OWNER in the message to the site's owner")
    it("should set GITHUB_TOKEN in the message to the user's GitHub access token")
    it("should set GENERATOR in the message to the site's build engine (e.g. 'jekyll')")
    it("should set SOURCE_REPO and SOURCE_OWNER in the repository if the build has a source owner / repo")
  })
})
