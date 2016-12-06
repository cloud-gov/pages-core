var crypto = require("crypto")
var expect = require("chai").expect
var nock = require("nock")
var Promise = require("bluebird")
var request = require("supertest-as-promised")
var sinon = require("sinon")

var factory = require("../support/factory")
var githubAPINocks = require("../support/githubAPINocks")
var session = require("../support/session")

describe("User API", () => {
  var userResponseExpectations = (response, user) => {
    expect(response).to.have.property("id", user.id)
    expect(response).to.have.property("username", user.username)
    expect(response).to.have.property("email", user.email)
    expect(response).to.have.property("sites")
    expect(response).to.have.property("builds")
  }

  describe("GET /v0/me", () => {
    it("should require authentication", done => {
      factory(User).then(user => {
        return request("http://localhost:1337")
          .get("/v0/me")
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should render the current user with their GitHub user data", done => {
      var user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get("/v0/me")
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        userResponseExpectations(response.body, user)
        expect(response.body).to.have.property("githubAccessToken", user.githubAccessToken)
        expect(response.body).to.have.property("githubUserId", user.githubUserId)
        done()
      })
    })
  })

  describe("GET /v0/user/:id", () => {
    it("should require authentication", done => {
      factory(User).then(user => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should show a JSON representation of the current user if the id matches theirs", done => {
      var user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        userResponseExpectations(response.body, user)
        done()
      })
    })

    it("should not include GitHub user data", done => {
      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(response.body).not.to.have.property("githubAccessToken")
        expect(response.body).not.to.have.property("githubUserId")
        done()
      })
    })

    it("should respond with a 403 if the requested user does not match the current user", done => {
      var user

      factory(User).then(model => {
        user = model
        return session()
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })
  })
})
