const crypto = require('crypto')
const expect = require("chai").expect
const request = require("supertest-as-promised")
const factory = require("../support/factory")

describe("Webhook API", () => {
  const signWebhookPayload = (payload) => {
    const secret = sails.config.webhook.secret
    const blob = JSON.stringify(payload)
    return 'sha1=' + crypto.createHmac('sha1', secret).update(blob).digest('hex')
  }

  const buildWebhookPayload = (user, site) => ({
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
      let site, user

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        user = site.users[0]
        return Build.find({ site: site.id, user: user.id })
      }).then(builds => {
        expect(builds).to.have.length(1)

        const payload = buildWebhookPayload(user, site)
        const signature = signWebhookPayload(payload)

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

    it("should create a user associated with the site for the sender if no user exists", done => {
      let site
      const username = crypto.randomBytes(3).toString("hex")

      factory(Site).then(model => {
        site = model

        const payload = buildWebhookPayload({ username: username }, site)
        const signature = signWebhookPayload(payload)

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
        return Build.findOne(response.body.id).populate("user")
      }).then(build => {
        expect(build.user.username).to.equal(username)
        return User.findOne(build.user.id).populate("sites")
      }).then(user => {
        expect(user.sites).to.have.length(1)
        expect(user.sites[0].id).to.equal(site.id)
        done()
      })
    })

    it("should not schedule a build if there are no new commits", done => {
      let site, user

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        user = site.users[0]
        return Build.find({ site: site.id, user: user.id })
      }).then(builds => {
        expect(builds).to.have.length(1)

        const payload = buildWebhookPayload(user, site)
        payload.commits = []
        const signature = signWebhookPayload(payload)

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

    it("should respond with a 400 if the site does not exist on Federalist", done => {
      factory(User).then(user => {
        const payload = buildWebhookPayload(user, {
          owner: user.username,
          repository: "fake-repo-name"
        })
        const signature = signWebhookPayload(payload)

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

    it("should respond with a 400 if the signature is invalid", done => {
      let site, user

      factory(Site).then(site => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(model => {
        site = model
        user = site.users[0]

        const payload = buildWebhookPayload(user, site)
        const signature = "123abc"

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
