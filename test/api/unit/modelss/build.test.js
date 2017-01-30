const expect = require("chai").expect

describe("Build model", () => {
  describe("before validate hook", () => {
    it("should add a build token")
    it("should not override a build token if one exists")
  })

  describe("after create hook", () => {
    it("should send a build new build message")
  })

  describe(".completeJob(message)", () => {
    it("should mark a build errored with a message if the error is a string")
    it("should mark a build errored with the error's message if the error is an error object")
    it("should sanitize GitHub access tokens from error message")
  })

  it("should have a site object before saving")
  it("should have a token before setting")
})
