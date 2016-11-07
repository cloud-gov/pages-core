var expect = require("chai").expect
var request = require("supertest-as-promised")
var factory = require("../support/factory")
var session = require("../support/session")

var sessionForCookie = (cookie) => {
  var sessionID = cookie.replace("sails.sid=s%3A", "").split(".")[0]
  return new Promise((resolve, reject) => {
    sails.config.session.store.get(sessionID, (err, sessionBody) => {
      if (err) {
        reject(err)
      } else {
        resolve(sessionBody)
      }
    })
  })
}

describe("Authentication request", () => {
  describe("GET /login", () => {
    it("should redirect to GitHub for OAuth2 authentication", done => {
      request("http://localhost:1337")
        .get("/auth/github")
        .expect("Location", /^https:\/\/github.com\/login\/oauth\/authorize.*/)
        .expect(302, done)
    })
  })

  describe("GET /logout", () => {
    it("should unauthenticate and remove the user from the session", done => {
      var cookie, user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(generatedCookie => {
        cookie = generatedCookie
        return sessionForCookie(cookie)
      }).then(session => {
        expect(session.authenticated).to.be.eq(true)
        expect(session.passport.user).to.eq(user.id)

        return request("http://localhost:1337")
          .get("/logout")
          .set("Cookie", cookie)
          .expect("Location", "/")
          .expect(302)
      }).then(response => {
        return sessionForCookie(cookie)
      }).then(session => {
        expect(session.authenticated).to.be.eq(false)
        expect(session.passport).to.be.empty
        done()
      })
    })

    it("should redirect to the root URL for an unauthenticated user", done => {
      request("http://localhost:1337")
        .get("/logout")
        .expect("Location", "/")
        .expect(302, done)
    })
  })
})
