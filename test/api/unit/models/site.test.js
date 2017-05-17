const expect = require("chai").expect
const sinon = require("sinon")
const config = require("../../../../config")
const factory = require("../../support/factory")
const { Site } = require("../../../../api/models")

describe("Site model", () => {
  describe("before validate hook", () => {
    it("should lowercase the owner and repository values", done => {
      Site.create({
        owner: "RepoOwner",
        repository: "RepoName",
      }).then(site => {
        expect(site.owner).to.equal("repoowner")
        expect(site.repository).to.equal("reponame")
        done()
      }).catch(done)
    })
  })

  describe(".viewLinkForBranch(branch)", () => {
    const s3BaseURL = `http://${config.s3.bucket}.s3-website-${config.s3.region}.amazonaws.com`

    context("for the default branch", () => {
      it("should return an S3 site link if there is no custom domain", done => {
        factory.site({ defaultBranch: "default-branch" }).then(site => {
          const viewLink = site.viewLinkForBranch("default-branch")
          expect(viewLink).to.equal(`${s3BaseURL}/site/${site.owner}/${site.repository}`)
          done()
        }).catch(done)
      })

      it("should return the custom domain if there is a cutom domain", done => {
        factory.site({
          domain: "https://www.example.gov",
          defaultBranch: "default-branch",
        }).then(site => {
          const viewLink = site.viewLinkForBranch("default-branch")
          expect(viewLink).to.equal("https://www.example.gov")
          done()
        }).catch(done)
      })
    })

    context("for the demo branch", () => {
      it("should return an s3 demo link if there is no demo domain", done => {
        factory.site({ demoBranch: "demo-branch" }).then(site => {
          const viewLink = site.viewLinkForBranch("demo-branch")
          expect(viewLink).to.equal(`${s3BaseURL}/demo/${site.owner}/${site.repository}`)
          done()
        }).catch(done)
      })

      it("should return the demo domain if there is a demo domain", done => {
        factory.site({
          demoDomain: "https://demo.example.gov",
          demoBranch: "demo-branch",
        }).then(site => {
          const viewLink = site.viewLinkForBranch("demo-branch")
          expect(viewLink).to.equal("https://demo.example.gov")
          done()
        }).catch(done)
      })
    })

    context("for a preview branch", () => {
      it("should return a federalist preview link", done => {
        factory.site().then(site => {
          const viewLink = site.viewLinkForBranch("preview-branch")
          expect(viewLink).to.equal(`http://localhost:1337/preview/${site.owner}/${site.repository}/preview-branch`)
          done()
        }).catch(done)
      })
    })
  })

  it("should not let the domain and demoDomain be equal", done => {
    Site.create({
      owner: "owner",
      repository: "repository",
      domain: "https://www.example.gov",
      demoDomain: "https://www.example.gov",
    }).catch(err => {
      expect(err.status).to.equal(403)
      expect(err.message).to.equal("Domain and demo domain cannot be the same")
      done()
    }).catch(done)
  })

  it("should not let the defaultBranch and demoBranch be equal", done => {
    Site.create({
      owner: "owner",
      repository: "repository",
      defaultBranch: "preview",
      demoBranch: "preview",
    }).catch(err => {
      expect(err.status).to.equal(403)
      expect(err.message).to.equal("Default branch and demo branch cannot be the same")
      done()
    }).catch(done)
  })
})
