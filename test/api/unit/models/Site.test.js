const expect = require('chai').expect
const sinon = require('sinon')

describe('Site Model', () => {

  describe('.beforeCreate', () => {
    it('should register site', (done) => {
      var registerSite = Site.registerSite
      Site.registerSite = sinon.spy(() => {
        expect(Site.registerSite.called).to.be.true
        Site.registerSite = registerSite
        done()
      })
      Site.beforeCreate({})
    })
  })

  describe(".beforeValidate", () => {
    it("should lowercase the GitHub repository owner and name", done => {
      const site = {
        owner: "RepoOwner",
        repository: "RepoName",
      }
      Site.beforeValidate(site, err => {
        expect(err).to.be.undefined
        expect(site.owner).to.equal("repoowner")
        expect(site.repository).to.equal("reponame")
        done()
      })
    })

    it("should not error for an empty hash", done => {
      Site.beforeValidate({}, err => {
        expect(err).to.be.undefined
        done()
      })
    })
  })

  describe('.registerSite', () => {
    it('should call GitHub.setWebhook', done => {
      const setWebhook = GitHub.setWebhook
      GitHub.setWebhook = sinon.spy(() => {
        expect(GitHub.setWebhook.called).to.be.true
        GitHub.setWebhook = setWebhook
        done()
        return Promise.resolve()
      })
      Site.registerSite({
        users: [1],
        owner: "someone",
        repository: "something",
      }, () => {})
    })
  })
})
