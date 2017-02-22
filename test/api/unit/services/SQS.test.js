const expect = require("chai").expect
const factory = require("../../support/factory")
const GitHub = require("../../../../api/services/SQS")
const SQS = require("../../../../api/services/SQS")

describe("SQS", () => {
  describe(".sendBuildMessage(build)", () => {
    it("should send a formatted build message", done => {
      const oldSendMessage = SQS.sqsClient.sendMessage
      SQS.sqsClient.sendMessage = (params, callback) => {
        SQS.sqsClient.sendMessage = oldSendMessage
        expect(params).to.have.property("MessageBody")
        expect(params).to.have.property("QueueUrl", config.sqs.queue)
        done()
      }
      SQS.sendBuildMessage({
        branch: "master",
        state: "processing",
        Site: {
          owner: "owner",
          repository: "formatted-message-repo",
          engine: "jekyll",
          defaultBranch: "master"
        },
        User: {
          passport: {
            tokens: { accessToken: "123abc" }
          }
        }
      })
    })
  })

  describe(".messageBodyForBuild(build)", () => {
    const messageEnv = (message, name) => {
      const element = message.environment.find(element => {
        return element.name === name
      })
      if (element) {
        return element.value
      }
    }

    it("should set the correct AWS credentials in the message", done => {
      factory.build().then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "AWS_ACCESS_KEY_ID")).to.equal(config.s3.accessKeyId)
        expect(messageEnv(message, "AWS_SECRET_ACCESS_KEY")).to.equal(config.s3.secretAccessKey)
        expect(messageEnv(message, "AWS_DEFAULT_REGION")).to.equal(config.s3.region)
        expect(messageEnv(message, "BUCKET")).to.equal(config.s3.bucket)
        done()
      }).catch(done)
    })

    it("should set STATUS_CALLBACK in the message", done => {
      factory.build().then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "STATUS_CALLBACK")).to.equal("http://localhost:1337/v0/build/" + build.id + "/status/" + build.token)
        done()
      }).catch(done)
    })

    it("should set LOG_CALLBACK in the message", done => {
      factory.build().then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "LOG_CALLBACK")).to.equal("http://localhost:1337/v0/build/" + build.id + "/log/" + build.token)
        done()
      }).catch(done)
    })

    context("building a site's default branch", () => {
      it("should set an empty string for BASEURL in the message for a site with a custom domain", done => {
        factory.site({ domain: "www.example.com", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory.build({ site: site, branch: "master" })
        }).then(build => {
          return Build.findById(build.id, { include: [Site, User] })
        }).then(build => {
          const message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("")
          done()
        }).catch(done)
      })

      it("it should set BASEURL in the message for a site without a custom domain", done => {
        factory.site({ domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory.build({ site: site, branch: "master" })
        }).then(build => {
          return Build.findById(build.id, { include: [Site, User] })
        }).then(build => {
          const message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("/site/owner/repo")
          done()
        }).catch(done)
      })

      it("should set SITE_PREFIX in the message to 'site/:owner/:repo/'", done => {
        factory.site({ domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory.build({ site: site, branch: "master" })
        }).then(build => {
          return Build.findById(build.id, { include: [Site, User] })
        }).then(build => {
          const message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "SITE_PREFIX")).to.equal("site/owner/repo")
          done()
        }).catch(done)
      })
    })

    context("building a site's preview branch", () => {
      it("should set BASEURL in the message for a site with a custom domain", done => {
        factory.site({ domain: "www.example.com", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory.build({ site: site, branch: "branch" })
        }).then(build => {
          return Build.findById(build.id, { include: [Site, User] })
        }).then(build => {
          const message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("/preview/owner/repo/branch")
          done()
        }).catch(done)
      })

      it("should set BASEURL in the message for a site without a custom domain", done => {
        factory.site({ domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory.build({ site: site, branch: "branch" })
        }).then(build => {
          return Build.findById(build.id, { include: [Site, User] })
        }).then(build => {
          const message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("/preview/owner/repo/branch")
          done()
        }).catch(done)
      })

      it("should set SITE_PREFIX in the message to 'preview/:owner/:repo/:branch'", done => {
        factory.site({ domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory.build({ site: site, branch: "branch" })
        }).then(build => {
          return Build.findById(build.id, { include: [Site, User] })
        }).then(build => {
          const message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "SITE_PREFIX")).to.equal("preview/owner/repo/branch")
          done()
        }).catch(done)
      })
    })

    it("should set CACHE_CONTROL in the message", done => {
      factory.build().then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "CACHE_CONTROL")).to.equal(config.build.cacheControl)
        done()
      }).catch(done)
    })

    it("should set BRANCH in the message to the name build's branch", done => {
      factory.site({ domain: "", defaultBranch: "master" }).then(site => {
        return factory.build({ site: site, branch: "branch" })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "BRANCH")).to.equal("branch")
        done()
      }).catch(done)
    })

    it("should set CONFIG in the message to the YAML config for the site", done => {
      factory.site({ config: "plugins_dir: _plugins" }).then(site => {
        return factory.build({ site: site })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "CONFIG")).to.equal("plugins_dir: _plugins")
        done()
      }).catch(done)
    })

    it("should set REPOSITORY in the message to the site's repo name", done => {
      factory.site({ repository: "site-repo" }).then(site => {
        return factory.build({ site: site })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "REPOSITORY")).to.equal("site-repo")
        done()
      }).catch(done)
    })

    it("should set OWNER in the message to the site's owner", done => {
      factory.site({ owner: "site-owner" }).then(site => {
        return factory.build({ site: site })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "OWNER")).to.equal("site-owner")
        done()
      }).catch(done)
    })

    it("should set GITHUB_TOKEN in the message to the user's GitHub access token", done => {
      let user

      factory.user({ githubAccessToken: "fake-github-token-123" }).then(model => {
        user = model
        return factory.site({ users: [user] })
      }).then(site => {
        return factory.build({ user: user, site: site })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "GITHUB_TOKEN")).to.equal("fake-github-token-123")
        done()
      }).catch(done)
    })

    it("should set GENERATOR in the message to the site's build engine (e.g. 'jekyll')", done => {
      factory.site({ engine: "hugo" }).then(site => {
        return factory.build({ site: site })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "GENERATOR")).to.equal("hugo")
        done()
      }).catch(done)
    })

    it("should set SOURCE_REPO and SOURCE_OWNER in the repository if the build has a source owner / repo", done => {
      factory.site({ engine: "hugo" }).then(site => {
        return factory.build({ source: { repository: "template", owner: "18f" } })
      }).then(build => {
        return Build.findById(build.id, { include: [Site, User] })
      }).then(build => {
        const message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "SOURCE_REPO")).to.equal("template")
        expect(messageEnv(message, "SOURCE_OWNER")).to.equal("18f")
        done()
      }).catch(done)
    })
  })
})
