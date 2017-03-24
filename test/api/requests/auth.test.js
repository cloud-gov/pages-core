const expect = require("chai").expect
const cookie = require('cookie')
const crypto = require("crypto")
const nock = require("nock")
const request = require("supertest-as-promised")
const config = require("../../../config")
const factory = require("../support/factory")
const githubAPINocks = require("../support/githubAPINocks")
const session = require("../support/session")
const { User } = require("../../../api/models")

var sessionCookieFromResponse = (response) => {
  var header = response.headers["set-cookie"][0]
  var parsedHeader = cookie.parse(header)
  var session = parsedHeader["federalist.sid"].replace("s:", "")
  return session.split(".")[0]
}

var sessionForCookie = (cookie) => {
  var sessionID = cookie.replace("federalist.sid=s%3A", "").split(".")[0]
  return new Promise((resolve, reject) => {
    config.session.store.get(sessionID, (err, sessionBody) => {
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
      let user, cookie

      const userPromise = factory.user()
      const sessionPromise = session(userPromise)

      Promise.props({
        user: userPromise,
        cookie: sessionPromise
      }).then(results => {
        user = results.user
        cookie = results.cookie
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
      }).catch(done)
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

        factory.user().then(model => {
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
        }).catch(done)
      })

      it("should not create a new user", done => {
        var userCount

        factory.user().then(user => {
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
        }).catch(done)
      })

      it("should update the user's GitHub access token", done => {
        var user

        factory.user().then(model => {
          user = model
          expect(user.githubAccessToken).not.to.equal("access-token-123abc")

          githubAPINocks.githubAuth(user.username, [{ id: 123456 }])

          return request("http://localhost:1337")
            .get("/auth/github/callback?code=auth-code-123abc")
            .expect(302)
        }).then(response => {
          return User.findById(user.id)
        }).then(user => {
          expect(user.githubAccessToken).to.equal("access-token-123abc")
          done()
        }).catch(done)
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
          return User.findById(userID )
        }).then(user => {
          expect(user).to.have.property("email", `user-${githubUserID}@example.com`)
          expect(user).to.have.property("username", `user-${githubUserID}`)
          expect(user).to.have.property("githubUserId", `${githubUserID}`)
          expect(user).to.have.property("githubAccessToken", "access-token-123abc")
          done()
        }).catch(done)
      })
    })

    it("should respond with a 401 if the authorization code is invalid", done => {
      nock("https://github.com")
        .post("/login/oauth/access_token", {
          client_id: config.passport.github.options.clientID,
          client_secret: config.passport.github.options.clientSecret,
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

    it("should redirect to a redirect path if one is set in the session", done => {
      const redirectPath = "/path/to/something"

      const sessionKey = crypto.randomBytes(8).toString("hex")
      const sessionBody = {
        cookie: {
          originalMaxAge: null,
          expires: null,
          httpOnly: true,
          path: "/"
        },
        authRedirectPath: redirectPath,
      }
      const signedSessionKey = sessionKey + "." + crypto
        .createHmac('sha256', config.session.secret)
        .update(sessionKey)
        .digest('base64')
        .replace(/\=+$/, '')
      const cookie = `${config.session.key}=s%3A${signedSessionKey}`

      config.session.store.set(sessionKey, sessionBody).then(() => {
        return factory.user()
      }).then(user => {
        githubAPINocks.githubAuth(user.username, [{ id: 123456 }])
        return request("http://localhost:1337")
          .get("/auth/github/callback?code=auth-code-123abc")
          .set("Cookie", cookie)
          .expect(302)
      }).then(response => {
        expect(response.header.location).to.equal(redirectPath)
        done()
      }).catch(done)
    })
  })
})
