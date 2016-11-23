//var AWS = require('aws-sdk-mock')
var expect = require("chai").expect
var sinon = require("sinon")
var factory = require("../../support/factory")

describe("SQS", () => {
  beforeEach(() => {
    sinon.stub(GitHub, "setWebhook", (_, __, done) => done())
  })

  afterEach(() => {
    GitHub.setWebhook.restore()
  })

  describe(".sendBuildMessage(build)", () => {
    it("should send a formatted build message", done => {
      var oldSendMessage = SQS.sqsClient.sendMessage
      SQS.sqsClient.sendMessage = (params, callback) => {
        SQS.sqsClient.sendMessage = oldSendMessage
        expect(params).to.have.property("MessageBody")
        expect(params).to.have.property("QueueUrl", sails.config.sqs.queue)
        done()
      }
      SQS.sendBuildMessage({
        branch: "master",
        state: "processing",
        site: {
          owner: "owner",
          repository: "repo",
          engine: "jekyll",
          defaultBranch: "master"
        },
        user: {
          passport: {
            tokens: { accessToken: "123abc" }
          }
        }
      })
    })
  })

  describe(".messageBodyForBuild(build)", () => {
    var messageEnv = (message, name) => {
      var element = message.environment.find(element => {
        return element.name === name
      })
      if (element) {
        return element.value
      }
    }

    it("should set the correct AWS credentials in the message", done => {
      factory(Build).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "AWS_ACCESS_KEY_ID")).to.equal(sails.config.s3.accessKeyId)
        expect(messageEnv(message, "AWS_SECRET_ACCESS_KEY")).to.equal(sails.config.s3.secretAccessKey)
        expect(messageEnv(message, "AWS_DEFAULT_REGION")).to.equal(sails.config.s3.region)
        expect(messageEnv(message, "BUCKET")).to.equal(sails.config.s3.bucket)
        done()
      })
    })

    it("should set CALLBACK in the message", done => {
      factory(Build).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "CALLBACK")).to.equal("http://localhost:1337/build/status/" + build.id + "/" + sails.config.build.token)
        done()
      })
    })

    context("building a site's default branch", () => {
      it("should set an empty string for BASEURL in the message for a site with a custom domain", done => {
        factory(Site, { domain: "www.example.com", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory(Build, { site: site, branch: "master" })
        }).then(build => {
          return Build.findOne({ id: build.id }).populate("site")
        }).then(build => {
          var message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("")
          done()
        })
      })

      it("it should set BASEURL in the message for a site without a custom domain", done => {
        factory(Site, { domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory(Build, { site: site, branch: "master" })
        }).then(build => {
          return Build.findOne({ id: build.id }).populate("site")
        }).then(build => {
          var message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("/site/owner/repo")
          done()
        })
      })

      it("should set PREFIX in the message to 'site/:owner/:repo/'", done => {
        factory(Site, { domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory(Build, { site: site, branch: "master" })
        }).then(build => {
          return Build.findOne({ id: build.id }).populate("site")
        }).then(build => {
          var message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "PREFIX")).to.equal("site/owner/repo")
          done()
        })
      })
    })

    context("building a site's preview branch", () => {
      it("should set BASEURL in the message for a site with a custom domain", done => {
        factory(Site, { domain: "www.example.com", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory(Build, { site: site, branch: "branch" })
        }).then(build => {
          return Build.findOne({ id: build.id }).populate("site")
        }).then(build => {
          var message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("/preview/owner/repo/branch")
          done()
        })
      })

      it("should set BASEURL in the message for a site without a custom domain", done => {
        factory(Site, { domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory(Build, { site: site, branch: "branch" })
        }).then(build => {
          return Build.findOne({ id: build.id }).populate("site")
        }).then(build => {
          var message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "BASEURL")).to.equal("/preview/owner/repo/branch")
          done()
        })
      })

      it("should set PREFIX in the message to 'preview/:owner/:repo/:branch'", done => {
        factory(Site, { domain: "", owner: "owner", repository: "repo", defaultBranch: "master" }).then(site => {
          return factory(Build, { site: site, branch: "branch" })
        }).then(build => {
          return Build.findOne({ id: build.id }).populate("site")
        }).then(build => {
          var message = SQS.messageBodyForBuild(build)
          expect(messageEnv(message, "PREFIX")).to.equal("preview/owner/repo/branch")
          done()
        })
      })
    })

    it("should set CACHE_CONTROL in the message", done => {
      factory(Build).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "CACHE_CONTROL")).to.equal(sails.config.build.cacheControl)
        done()
      })
    })

    it("should set BRANCH in the message to the name build's branch", done => {
      factory(Site, { domain: "", defaultBranch: "master" }).then(site => {
        return factory(Build, { site: site, branch: "branch" })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "BRANCH")).to.equal("branch")
        done()
      })
    })

    it("should set CONFIG in the message to the YAML config for the site", done => {
      factory(Site, { config: "plugins_dir: _plugins" }).then(site => {
        return factory(Build, { site: site })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "CONFIG")).to.equal("plugins_dir: _plugins")
        done()
      })
    })

    it("should set REPOSITORY in the message to the site's repo name", done => {
      factory(Site, { repository: "site-repo" }).then(site => {
        return factory(Build, { site: site })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "REPOSITORY")).to.equal("site-repo")
        done()
      })
    })

    it("should set OWNER in the message to the site's owner", done => {
      factory(Site, { owner: "site-owner" }).then(site => {
        return factory(Build, { site: site })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "OWNER")).to.equal("site-owner")
        done()
      })
    })

    it("should set GITHUB_TOKEN in the message to the user's GitHub access token", done => {
      var user

      factory(User, { githubAccessToken: "fake-github-token-123" }).then(model => {
        user = model
        return factory(Site, { users: [user] })
      }).then(site => {
        return factory(Build, { user: user, site: site })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site").populate("user")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "GITHUB_TOKEN")).to.equal("fake-github-token-123")
        done()
      })
    })

    it("should set GENERATOR in the message to the site's build engine (e.g. 'jekyll')", done => {
      factory(Site, { engine: "hugo" }).then(site => {
        return factory(Build, { site: site })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "GENERATOR")).to.equal("hugo")
        done()
      })
    })

    it("should set SOURCE_REPO and SOURCE_OWNER in the repository if the build has a source owner / repo", done => {
      factory(Site, { engine: "hugo" }).then(site => {
        return factory(Build, { source: { repository: "template", owner: "18f" } })
      }).then(build => {
        return Build.findOne({ id: build.id }).populate("site")
      }).then(build => {
        var message = SQS.messageBodyForBuild(build)
        expect(messageEnv(message, "SOURCE_REPO")).to.equal("template")
        expect(messageEnv(message, "SOURCE_OWNER")).to.equal("18f")
        done()
      })
    })
  })
})
