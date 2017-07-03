const expect = require('chai').expect;
const config = require('../../../../config');
const factory = require('../../support/factory');
const SQS = require('../../../../api/services/SQS');
const { Build, Site, User } = require('../../../../api/models');

describe('SQS', () => {
  describe('.sendBuildMessage(build)', () => {
    it('should send a formatted build message', (done) => {
      const oldSendMessage = SQS.sqsClient.sendMessage;
      SQS.sqsClient.sendMessage = (params) => {
        SQS.sqsClient.sendMessage = oldSendMessage;
        expect(params).to.have.property('MessageBody');
        expect(params).to.have.property('QueueUrl', config.sqs.queue);
        done();
      };
      SQS.sendBuildMessage({
        branch: 'master',
        state: 'processing',
        Site: {
          owner: 'owner',
          repository: 'formatted-message-repo',
          engine: 'jekyll',
          defaultBranch: 'master',
        },
        User: {
          passport: {
            tokens: { accessToken: '123abc' },
          },
        },
      });
    });
  });

  describe('.messageBodyForBuild(build)', () => {
    const messageEnv = (message, name) => {
      const element = message.environment.find(el => el.name === name);
      if (element) {
        return element.value;
      }
      return null;
    };

    it('should set the correct AWS credentials in the message', (done) => {
      factory.build()
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'AWS_ACCESS_KEY_ID')).to.equal(config.s3.accessKeyId);
          expect(messageEnv(message, 'AWS_SECRET_ACCESS_KEY')).to.equal(config.s3.secretAccessKey);
          expect(messageEnv(message, 'AWS_DEFAULT_REGION')).to.equal(config.s3.region);
          expect(messageEnv(message, 'BUCKET')).to.equal(config.s3.bucket);
          done();
        })
        .catch(done);
    });

    it('should set STATUS_CALLBACK in the message', (done) => {
      factory.build()
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'STATUS_CALLBACK')).to.equal(`http://localhost:1337/v0/build/${build.id}/status/${build.token}`);
          done();
        })
        .catch(done);
    });

    it('should set LOG_CALLBACK in the message', (done) => {
      factory.build()
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'LOG_CALLBACK')).to.equal(`http://localhost:1337/v0/build/${build.id}/log/${build.token}`);
          done();
        })
        .catch(done);
    });

    context("building a site's default branch", () => {
      it('should set an empty string for BASEURL in the message for a site with a custom domain', (done) => {
        const domains = [
          'https://example.com',
          'https://example.com/',
          'http://example.com',
          'http://example.com/',
        ];

        const baseurlPromises = domains.map(domain => factory.site({ domain, defaultBranch: 'master' }).then(site => factory.build({ site, branch: 'master' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          return messageEnv(message, 'BASEURL');
        }));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill(''));
          done();
        })
        .catch(done);
      });

      it('it should set BASEURL in the message for a site without a custom domain', (done) => {
        factory.site({ domain: '', owner: 'owner', repository: 'repo', defaultBranch: 'master' })
          .then(site => factory.build({ site, branch: 'master' }))
          .then(build => Build.findById(build.id, { include: [Site, User] }))
          .then((build) => {
            const message = SQS.messageBodyForBuild(build);
            expect(messageEnv(message, 'BASEURL')).to.equal('/site/owner/repo');
            done();
          })
          .catch(done);
      });

      it('should respect the path component of a custom domain when setting BASEURL in the message', (done) => {
        const domains = [
          'https://example.com/abc/def',
          'https://example.com/abc/def/',
          'http://example.com/abc/def',
          'http://example.com/abc/def/',
        ];

        const baseurlPromises = domains.map(domain => factory.site({ domain, defaultBranch: 'master' }).then(site => factory.build({ site, branch: 'master' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          return messageEnv(message, 'BASEURL');
        }));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill('/abc/def'));
          done();
        })
        .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'site/:owner/:repo/'", (done) => {
        factory.site({ domain: '', owner: 'owner', repository: 'repo', defaultBranch: 'master' })
          .then(site => factory.build({ site, branch: 'master' }))
          .then(build => Build.findById(build.id, { include: [Site, User] }))
          .then((build) => {
            const message = SQS.messageBodyForBuild(build);
            expect(messageEnv(message, 'SITE_PREFIX')).to.equal('site/owner/repo');
            done();
          })
          .catch(done);
      });
    });

    context("building a site's demo branch", () => {
      it('should set an empty string for BASEURL in the message for a site with a demo domain', (done) => {
        const domains = [
          'https://example.com',
          'https://example.com/',
          'http://example.com',
          'http://example.com/',
        ];

        const baseurlPromises = domains.map(domain => factory.site({ demoDomain: domain, demoBranch: 'demo' }).then(site => factory.build({ site, branch: 'demo' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          return messageEnv(message, 'BASEURL');
        }));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill(''));
          done();
        })
        .catch(done);
      });

      it('it should set BASEURL in the message for a site without a demo domain', (done) => {
        factory.site({ demoDomain: '', owner: 'owner', repository: 'repo', demoBranch: 'demo' }).then(site => factory.build({ site, branch: 'demo' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'BASEURL')).to.equal('/demo/owner/repo');
          done();
        })
        .catch(done);
      });

      it('should respect the path component of a custom domain when setting BASEURL in the message', (done) => {
        const domains = [
          'https://example.com/abc/def',
          'https://example.com/abc/def/',
          'http://example.com/abc/def',
          'http://example.com/abc/def/',
        ];

        const baseurlPromises = domains.map(domain => factory.site({ demoDomain: domain, demoBranch: 'demo' }).then(site => factory.build({ site, branch: 'demo' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          return messageEnv(message, 'BASEURL');
        }));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill('/abc/def'));
          done();
        })
        .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'demo/:owner/:repo'", (done) => {
        factory.site({ demoDomain: '', owner: 'owner', repository: 'repo', demoBranch: 'demo' }).then(site => factory.build({ site, branch: 'demo' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'SITE_PREFIX')).to.equal('demo/owner/repo');
          done();
        })
        .catch(done);
      });
    });

    context("building a site's preview branch", () => {
      it('should set BASEURL in the message for a site with a custom domain', (done) => {
        factory.site({ domain: 'http://www.example.com', owner: 'owner', repository: 'repo', defaultBranch: 'master' }).then(site => factory.build({ site, branch: 'branch' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'BASEURL')).to.equal('/preview/owner/repo/branch');
          done();
        })
        .catch(done);
      });

      it('should set BASEURL in the message for a site without a custom domain', (done) => {
        factory.site({ domain: '', owner: 'owner', repository: 'repo', defaultBranch: 'master' }).then(site => factory.build({ site, branch: 'branch' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'BASEURL')).to.equal('/preview/owner/repo/branch');
          done();
        })
        .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'preview/:owner/:repo/:branch'", (done) => {
        factory.site({ domain: '', owner: 'owner', repository: 'repo', defaultBranch: 'master' }).then(site => factory.build({ site, branch: 'branch' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'SITE_PREFIX')).to.equal('preview/owner/repo/branch');
          done();
        })
        .catch(done);
      });
    });

    it('should set CACHE_CONTROL in the message', (done) => {
      factory.build().then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'CACHE_CONTROL')).to.equal(config.build.cacheControl);
          done();
        })
        .catch(done);
    });

    it("should set BRANCH in the message to the name build's branch", (done) => {
      factory.site({ domain: '', defaultBranch: 'master' })
        .then(site => factory.build({ site, branch: 'branch' }))
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'BRANCH')).to.equal('branch');
          done();
        })
        .catch(done);
    });

    it('should set CONFIG in the message to the YAML config for the site on the default branch', (done) => {
      factory.site({
        defaultBranch: 'master',
        config: 'plugins_dir: _plugins',
        demoConfig: 'plugins_dir: _demo_plugins',
        previewConfig: 'plugins_dir: _preview_plugins',
      }).then(site => factory.build({ site, branch: 'master' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
        const message = SQS.messageBodyForBuild(build);
        expect(messageEnv(message, 'CONFIG')).to.equal('plugins_dir: _plugins');
        done();
      })
      .catch(done);
    });

    it('should set CONFIG in the message to the YAML config for the site on a demo branch', (done) => {
      factory.site({
        demoBranch: 'demo',
        config: 'plugins_dir: _plugins',
        demoConfig: 'plugins_dir: _demo_plugins',
        previewConfig: 'plugins_dir: _preview_plugins',
      }).then(site => factory.build({ site, branch: 'demo' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
        const message = SQS.messageBodyForBuild(build);
        expect(messageEnv(message, 'CONFIG')).to.equal('plugins_dir: _demo_plugins');
        done();
      })
      .catch(done);
    });

    it('should set CONFIG in the message to the YAML config for the site on a preview branch', (done) => {
      factory.site({
        defaultBranch: 'master',
        config: 'plugins_dir: _plugins',
        demoConfig: 'plugins_dir: _demo_plugins',
        previewConfig: 'plugins_dir: _preview_plugins',
      }).then(site => factory.build({ site, branch: 'preview' })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
        const message = SQS.messageBodyForBuild(build);
        expect(messageEnv(message, 'CONFIG')).to.equal('plugins_dir: _preview_plugins');
        done();
      })
      .catch(done);
    });

    it("should set REPOSITORY in the message to the site's repo name", (done) => {
      factory.site({ repository: 'site-repo' }).then(site => factory.build({ site })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
        const message = SQS.messageBodyForBuild(build);
        expect(messageEnv(message, 'REPOSITORY')).to.equal('site-repo');
        done();
      })
      .catch(done);
    });

    it("should set OWNER in the message to the site's owner", (done) => {
      factory.site({ owner: 'site-owner' }).then(site => factory.build({ site })).then(build => Build.findById(build.id, { include: [Site, User] })).then((build) => {
        const message = SQS.messageBodyForBuild(build);
        expect(messageEnv(message, 'OWNER')).to.equal('site-owner');
        done();
      })
      .catch(done);
    });

    it("should set GITHUB_TOKEN in the message to the user's GitHub access token", (done) => {
      let user;

      factory.user({ githubAccessToken: 'fake-github-token-123' })
        .then((model) => {
          user = model;
          return factory.site({ users: [user] });
        })
        .then(site => factory.build({ user, site }))
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'GITHUB_TOKEN')).to.equal('fake-github-token-123');
          done();
        })
        .catch(done);
    });

    it("should set GENERATOR in the message to the site's build engine (e.g. 'jekyll')", (done) => {
      factory.site({ engine: 'hugo' })
        .then(site => factory.build({ site }))
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'GENERATOR')).to.equal('hugo');
          done();
        })
        .catch(done);
    });

    it('should set SOURCE_REPO and SOURCE_OWNER in the repository if the build has a source owner / repo', (done) => {
      factory.site({ engine: 'hugo' })
        .then(() => factory.build({ source: { repository: 'template', owner: '18f' } }))
        .then(build => Build.findById(build.id, { include: [Site, User] }))
        .then((build) => {
          const message = SQS.messageBodyForBuild(build);
          expect(messageEnv(message, 'SOURCE_REPO')).to.equal('template');
          expect(messageEnv(message, 'SOURCE_OWNER')).to.equal('18f');
          done();
        })
        .catch(done);
    });
  });
});
