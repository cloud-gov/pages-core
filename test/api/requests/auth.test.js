var expect = require("chai").expect
var cookie = require('cookie')
var nock = require("nock")
var request = require("supertest-as-promised")
var factory = require("../support/factory")
var githubAPINocks = require("../support/githubAPINocks")
var session = require("../support/session")

var sessionCookieFromResponse = (response) => {
  var header = response.headers["set-cookie"][0]
  var parsedHeader = cookie.parse(header)
  var session = parsedHeader["sails.sid"].replace("s:", "")
  return session.split(".")[0]
}

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
        expect(session.authenticated).to.be.equal(true)
        expect(session.passport.user).to.equal(user.id)

        return request("http://localhost:1337")
          .get("/logout")
          .set("Cookie", cookie)
          .expect("Location", "/")
          .expect(302)
      }).then(response => {
        return sessionForCookie(cookie)
      }).then(session => {
        expect(session.authenticated).to.equal(false)
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

  describe("GET /auth/github/callback", () => {
    context("when the user exists in the database", () => {
      it("should authenticate the user", done => {
        var user

        factory(User).then(model => {
          user = model
          return githubAPINocks.githubAuth(user.username, [{ id: 123456 }])
        }).then(() => {
          return request("http://localhost:1337")
            .get("/auth/github/callback?code=auth-code-123abc")
            .expect(302)
        }).then(response => {
          var cookie = sessionCookieFromResponse(response)
          return sessionForCookie(cookie)
        }).then(session => {
          expect(session.authenticated).to.equal(true)
          expect(session.passport.user).to.equal(user.id)
          done()
        })
      })

      it("should not create a new user", done => {
        var userCount

        factory(User).then(user => {
          githubAPINocks.githubAuth(user.username, [{ id: 123456 }])
          return User.count()
        }).then(count => {
          userCount = count
          return request("http://localhost:1337")
            .get("/auth/github/callback?code=auth-code-123abc")
            .expect(302)
        }).then(response => {
          return User.count()
        }).then(count => {
          expect(count).to.equal(userCount)
          done()
        })
      })

      it("should create a GitHub passport for the user if one does not exist", done => {
        var user

        factory(User).then(model => {
          user = model
          githubAPINocks.githubAuth(user.username, [{ id: 123456 }])
          return Passport.count({ user: user })
        }).then(passportCount => {
          expect(passportCount).to.equal(0)
          return request("http://localhost:1337")
            .get("/auth/github/callback?code=auth-code-123abc")
            .expect(302)
        }).then(response => {
          return Passport.find({ user: user.id })
        }).then(passports => {
          expect(passports).to.have.length(1)
          expect(passports[0].provider).to.equal("github")
          expect(passports[0].tokens.accessToken).to.equal("access-token-123abc")
          done()
        })
      })

      it("should update the GitHub passport for the user if one exists", done => {
        var user

        factory(User).then(model => {
          user = model
          var githubUserID = Math.floor(Math.random() * 10000)

          githubAPINocks.accessToken()
          githubAPINocks.user({ username: user.username, githubUserID: githubUserID })
          githubAPINocks.userOrganizations()

          return Passport.create({
            protocol: "oauth2",
            provider: "github",
            identifier: githubUserID,
            tokens: { accessToken: "old-access-token-123" },
            user: user.id
          })
        }).then(model => {
          return request("http://localhost:1337")
            .get("/auth/github/callback?code=auth-code-123abc")
            .expect(302)
        }).then(response => {
          return Passport.find({ user: user.id })
        }).then(passports => {
          expect(passports).to.have.length(1)
          expect(passports[0].provider).to.equal("github")
          expect(passports[0].tokens.accessToken).to.equal("access-token-123abc")
          done()
        })
      })
    })

    context("when the user does not exist in the database", () => {
      it("should create and authenticate the user", done => {
        var githubUserID = Math.floor(Math.random() * 10000)

        githubAPINocks.accessToken()
        githubAPINocks.user({ githubUserID: githubUserID })
        githubAPINocks.userOrganizations()

        var authRequest = request("http://localhost:1337")
          .get("/auth/github/callback?code=auth-code-123abc")
          .expect(302)

        authRequest.then(response => {
          var cookie = sessionCookieFromResponse(response)
          return sessionForCookie(cookie)
        }).then(session => {
          expect(session.authenticated).to.equal(true)
          var userID = session.passport.user
          return User.findOne({ id: userID })
        }).then(user => {
          expect(user).to.have.property("email", `user-${githubUserID}@example.com`)
          expect(user).to.have.property("username", `user-${githubUserID}`)
          done()
        })
      })

      it("should create a passport for the user", done => {
        githubAPINocks.githubAuth()

        var authRequest = request("http://localhost:1337")
          .get("/auth/github/callback?code=auth-code-123abc")
          .expect(302)

        authRequest.then(response => {
          var cookie = sessionCookieFromResponse(response)
          return sessionForCookie(cookie)
        }).then(session => {
          var userID = session.passport.user
          return User.findOne({ id: userID })
        }).then(user => {
          return Passport.findOne({ user: user.id })
        }).then(passport => {
          expect(passport.provider).to.equal("github")
          expect(passport.tokens.accessToken).to.equal("access-token-123abc")
          done()
        })
      })
    })

    it("should respond with a 401 if the authorization code is invalid", done => {
      nock("https://github.com")
        .post("/login/oauth/access_token", {
          client_id: sails.config.passport.github.options.clientID,
          client_secret: sails.config.passport.github.options.clientSecret,
          code: "invalid-code"
        })
        .reply(401)

      request("http://localhost:1337")
        .get("/auth/github/callback?code=invalid-code")
        .expect(401, done)
    })

    it("should respond with a 401 if the user is not in a whitelisted GitHub organization", done => {
      githubAPINocks.githubAuth("unatuhorized-user", [{ id: 654321 }])

      request("http://localhost:1337")
        .get("/auth/github/callback?code=auth-code-123abc")
        .expect(401, done)
    })
  })
})
