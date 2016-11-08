var crypto = require('crypto')
var expect = require("chai").expect
var request = require("supertest-as-promised")
var sinon = require("sinon")
var factory = require("../support/factory")

describe("Webhook API", () => {
  beforeEach(() => {
    sinon.stub(GitHub, "setWebhook", (_, __, done) => done())
  })

  afterEach(() => {
    GitHub.setWebhook.restore()
  })

  var signWebhookPayload = (payload) => {
    var secret = sails.config.webhook.secret
    var blob = JSON.stringify(payload)
    return 'sha1=' + crypto.createHmac('sha1', secret).update(blob).digest('hex')
  }

  var buildWebhookPayload = (user, site) => ({
      ref: "refs/heads/master",
      commits: [{
        id: "456def"
      }],
      sender: {
        login: user.username,
      },
      repository: {
        full_name: `${site.owner}/${site.repository}`
      }
    })

  describe("POST /webhook/github", () => {
    it("should create a new site build for the sender", done => {
      var site, user

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        user = site.users[0]
        return Build.find({ site: site.id, user: user.id })
      }).then(builds => {
        expect(builds).to.have.length(1)

        var payload = buildWebhookPayload(user, site)
        signature = signWebhookPayload(payload)

        return request("http://localhost:1337")
          .post("/webhook/github")
          .send(payload)
          .set({
            "X-GitHub-Event": "push",
            "X-Hub-Signature": signature,
            "X-GitHub-Delivery": "123abc"
          })
          .expect(200)
      }).then(response => {
        return Build.find({ site: site.id, user: user.id })
      }).then(builds => {
        expect(builds).to.have.length(2)
        done()
      })
    })

    it("should not schedule a build if there are no new commits", done => {
      var site, user

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        user = site.users[0]
        return Build.find({ site: site.id, user: user.id })
      }).then(builds => {
        expect(builds).to.have.length(1)

        var payload = buildWebhookPayload(user, site)
        payload.commits = []
        signature = signWebhookPayload(payload)

        return request("http://localhost:1337")
          .post("/webhook/github")
          .send(payload)
          .set({
            "X-GitHub-Event": "push",
            "X-Hub-Signature": signature,
            "X-GitHub-Delivery": "123abc"
          })
          .expect(200)
      }).then(response => {
        return Build.find({ site: site.id, user: user.id })
      }).then(builds => {
        expect(builds).to.have.length(1)
        done()
      })
    })

    it("should respond with a 400 if the signature is invalid", done => {
      var site, user

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        user = site.users[0]

        var payload = buildWebhookPayload(user, site)
        signature = "123abc"

        request("http://localhost:1337")
          .post("/webhook/github")
          .send(payload)
          .set({
            "X-GitHub-Event": "push",
            "X-Hub-Signature": signature,
            "X-GitHub-Delivery": "123abc"
          })
          .expect(400, done)
      })
    })
  })
})
