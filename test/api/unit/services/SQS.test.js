const nock = require('nock');
const { expect } = require('chai');
const { stub } = require('sinon');
const AWSMocks = require('../../support/aws-mocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const config = require('../../../../config');
const factory = require('../../support/factory');
const SQS = require('../../../../api/services/SQS');
const {
  Build, Site, User, UserEnvironmentVariable,
} = require('../../../../api/models');

describe('SQS', () => {
  afterEach(() => nock.cleanAll());

  beforeEach(() => {
    mockTokenRequest();
    apiNocks.mockDefaultCredentials();
  });

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
        url: 'testBucket.gov/boo/hoo',
        Site: {
          owner: 'owner',
          repository: 'formatted-message-repo',
          engine: 'jekyll',
          defaultBranch: 'master',
          s3ServiceName: config.s3.serviceName,
        },
        User: {
          passport: {
            tokens: { accessToken: '123abc' },
          },
        },
      }, 2);
    });

    it('should send a formatted build message and setup S3 bucket config on first built', (done) => {
      const oldSendMessage = SQS.sqsClient.sendMessage;
      const owner = 'owner';
      const repository = 'formatted-message-repo';
      SQS.sqsClient.sendMessage = (params) => {
        SQS.sqsClient.sendMessage = oldSendMessage;
        expect(params).to.have.property('MessageBody');
        expect(params).to.have.property('QueueUrl', config.sqs.queue);
        done();
      };

      AWSMocks.mocks.S3.headBucket = () => ({ promise: () => Promise.resolve() });

      AWSMocks.mocks.S3.putBucketWebsite = (params) => {
        expect(params).to.deep.equal({
          Bucket: config.s3.bucket,
          WebsiteConfiguration: {
            ErrorDocument: {
              Key: `site/${owner}/${repository}/404.html`,
            },
            IndexDocument: {
              Suffix: 'index.html',
            },
          },
        });
        return { promise: () => Promise.resolve() };
      };

      AWSMocks.mocks.S3.putObject = (params) => {
        expect(params).to.deep.equal({
          Body: 'User-agent: *\nDisallow: /\n',
          Key: 'robots.txt',
          Bucket: config.s3.bucket,
          CacheControl: 'max-age=60',
          ServerSideEncryption: 'AES256',
          ContentType: 'text/plain',
        });
        return { promise: () => Promise.resolve() };
      };

      SQS.sendBuildMessage({
        branch: 'master',
        state: 'processing',
        url: 'testBucket.gov/boo/hoo',
        Site: {
          owner,
          repository,
          engine: 'jekyll',
          defaultBranch: 'master',
          s3ServiceName: config.s3.serviceName,
        },
        User: {
          passport: {
            tokens: { accessToken: '123abc' },
          },
        },
      }, 1);
    });
  });

  describe('.messageBodyForBuild(build)', () => {
    let sendMessageStub;

    beforeEach(() => {
      sendMessageStub = stub(SQS, 'sendBuildMessage').returns({});
    });

    afterEach(() => {
      sendMessageStub.restore();
    });

    const messageEnv = (message, name) => {
      const element = message.environment.find(el => el.name === name);
      if (element) {
        return element.value;
      }
      return null;
    };

    it('should set the correct AWS credentials in the message', (done) => {
      factory.build()
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
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
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then((build) => { // eslint-disable-line
          return SQS.messageBodyForBuild(build)
            .then((message) => {
              expect(messageEnv(message, 'STATUS_CALLBACK')).to.equal(`http://localhost:1337/v0/build/${build.id}/status/${build.token}`);
              done();
            });
        })
        .catch(done);
    });

    it('should set LOG_CALLBACK in the message', (done) => {
      factory.build()
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then((build) => { // eslint-disable-line
          return SQS.messageBodyForBuild(build)
            .then((message) => {
              expect(messageEnv(message, 'LOG_CALLBACK')).to.equal(`http://localhost:1337/v0/build/${build.id}/log/${build.token}`);
              done();
            });
        })
        .catch(done);
    });

    it('should set USER_ENVIRONMENT_VARIABLES in the message when present', (done) => {
      factory.build()
        .then(build => factory.userEnvironmentVariable.create({ site: { id: build.site } })
          .then(() => build))
        .then(build => Build.findByPk(build.id, {
          include: [{
            model: Site,
            include: [UserEnvironmentVariable],
          }, User],
        }))
        .then((build) => { // eslint-disable-line
          return SQS.messageBodyForBuild(build)
            .then((message) => {
              const uevs = build.Site.UserEnvironmentVariables.map(uev => ({
                name: uev.name,
                ciphertext: uev.ciphertext,
              }));
              expect(JSON.parse(messageEnv(message, 'USER_ENVIRONMENT_VARIABLES'))).to.deep.eq(uevs);
              done();
            });
        })
        .catch(done);
    });

    it('should set USER_ENVIRONMENT_VARIABLES to an empty array when absent', (done) => {
      factory.build()
        .then(build => Build.findByPk(build.id, {
          include: [{
            model: Site,
            include: [UserEnvironmentVariable],
          }, User],
        }))
        .then((build) => { // eslint-disable-line
          return SQS.messageBodyForBuild(build)
            .then((message) => {
              expect(JSON.parse(messageEnv(message, 'USER_ENVIRONMENT_VARIABLES'))).to.deep.eq([]);
              done();
            });
        })
        .catch(done);
    });

    context("building a site's default branch", () => {
      it('should set an empty string for BASEURL in the message for a site with a custom domain', (done) => {
        const domains = [
          'https://example.com',
          'https://example.com/',
        ];

        const baseurlPromises = domains.map(domain => factory
          .site({ domain, defaultBranch: 'master' })
          .then(site => factory.build({ site, branch: 'master' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then(message => messageEnv(message, 'BASEURL')));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill(''));
          done();
        })
          .catch(done);
      });

      it('it should set BASEURL in the message for a site without a custom domain', (done) => {
        factory.site({
          domain: '',
          owner: 'owner',
          repository: 'repo',
          defaultBranch: 'master',
        })
          .then(site => factory.build({ site, branch: 'master' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/site/owner/repo');
            done();
          })
          .catch(done);
      });

      it('should respect the path component of a custom domain when setting BASEURL in the message', (done) => {
        const domains = [
          'https://example.com/abc/def',
          'https://example.com/abc/def/',
        ];

        const baseurlPromises = domains.map(domain => factory
          .site({ domain, defaultBranch: 'master' })
          .then(site => factory.build({ site, branch: 'master' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then(message => messageEnv(message, 'BASEURL')));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill('/abc/def'));
          done();
        })
          .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'site/:owner/:repo/'", (done) => {
        factory.site({
          domain: '',
          owner: 'owner',
          repository: 'repo',
          defaultBranch: 'master',
        })
          .then(site => factory.build({ site, branch: 'master' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
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
        ];

        const baseurlPromises = domains.map(domain => factory
          .site({ demoDomain: domain, demoBranch: 'demo' })
          .then(site => factory.build({ site, branch: 'demo' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then(message => messageEnv(message, 'BASEURL')));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill(''));
          done();
        })
          .catch(done);
      });

      it('it should set BASEURL in the message for a site without a demo domain', (done) => {
        factory.site({
          demoDomain: '',
          owner: 'owner',
          repository: 'repo',
          demoBranch: 'demo',
        })
          .then(site => factory.build({ site, branch: 'demo' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/demo/owner/repo');
            done();
          })
          .catch(done);
      });

      it('should respect the path component of a custom domain when setting BASEURL in the message', (done) => {
        const domains = [
          'https://example.com/abc/def',
          'https://example.com/abc/def/',
        ];

        const baseurlPromises = domains.map(domain => factory
          .site({ demoDomain: domain, demoBranch: 'demo' })
          .then(site => factory.build({ site, branch: 'demo' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then(message => messageEnv(message, 'BASEURL')));

        Promise.all(baseurlPromises).then((baseurls) => {
          expect(baseurls).to.deep.equal(Array(domains.length).fill('/abc/def'));
          done();
        })
          .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'demo/:owner/:repo'", (done) => {
        factory.site({
          demoDomain: '',
          owner: 'owner',
          repository: 'repo',
          demoBranch: 'demo',
        })
          .then(site => factory.build({ site, branch: 'demo' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'SITE_PREFIX')).to.equal('demo/owner/repo');
            done();
          })
          .catch(done);
      });
    });

    context("building a site's preview branch", () => {
      it('should set BASEURL in the message for a site with a custom domain', (done) => {
        factory
          .site({
            domain: 'https://www.example.com',
            owner: 'owner',
            repository: 'repo',
            defaultBranch: 'master',
          })
          .then(site => factory.build({ site, branch: 'branch' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/preview/owner/repo/branch');
            done();
          })
          .catch(done);
      });

      it('should set BASEURL in the message for a site without a custom domain', (done) => {
        factory.site({
          domain: '',
          owner: 'owner',
          repository: 'repo',
          defaultBranch: 'master',
        })
          .then(site => factory.build({ site, branch: 'branch' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/preview/owner/repo/branch');
            done();
          })
          .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'preview/:owner/:repo/:branch'", (done) => {
        factory.site({
          domain: '',
          owner: 'owner',
          repository: 'repo',
          defaultBranch: 'master',
        })
          .then(site => factory.build({ site, branch: 'branch' }))
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'SITE_PREFIX')).to.equal('preview/owner/repo/branch');
            done();
          })
          .catch(done);
      });
    });

    it('should set CACHE_CONTROL in the message', (done) => {
      factory.build()
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'CACHE_CONTROL')).to.equal(config.build.cacheControl);
          done();
        })
        .catch(done);
    });

    it("should set BRANCH in the message to the name build's branch", (done) => {
      factory.site({ domain: '', defaultBranch: 'master' })
        .then(site => factory.build({ site, branch: 'branch' }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'BRANCH')).to.equal('branch');
          done();
        })
        .catch(done);
    });

    it('should set CONFIG in the message to the YAML config for the site on the default branch', (done) => {
      factory.site({
        defaultBranch: 'master',
        defaultConfig: { plugins_dir: '_plugins' },
        demoConfig: { plugins_dir: '_demo_plugins' },
        previewConfig: { plugins_dir: '_preview_plugins' },
      })
        .then(site => factory.build({ site, branch: 'master' }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'CONFIG')).to.equal('plugins_dir: _plugins\n');
          done();
        })
        .catch(done);
    });

    it('should set CONFIG in the message to the YAML config for the site on a demo branch', (done) => {
      factory.site({
        demoBranch: 'demo',
        defaultConfig: { plugins_dir: '_plugins' },
        demoConfig: { plugins_dir: '_demo_plugins' },
        previewConfig: { plugins_dir: '_preview_plugins' },
      })
        .then(site => factory.build({ site, branch: 'demo' }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'CONFIG')).to.equal('plugins_dir: _demo_plugins\n');
          done();
        })
        .catch(done);
    });

    it('should set CONFIG in the message to the YAML config for the site on a preview branch', (done) => {
      factory.site({
        defaultBranch: 'master',
        defaultConfig: { plugins_dir: '_plugins' },
        demoConfig: { plugins_dir: '_demo_plugins' },
        previewConfig: { plugins_dir: '_preview_plugins' },
      })
        .then(site => factory.build({ site, branch: 'preview' }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'CONFIG')).to.equal('plugins_dir: _preview_plugins\n');
          done();
        })
        .catch(done);
    });

    it("should set REPOSITORY in the message to the site's repo name", (done) => {
      factory.site({ repository: 'site-repo' })
        .then(site => factory.build({ site }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'REPOSITORY')).to.equal('site-repo');
          done();
        })
        .catch(done);
    });

    it("should set OWNER in the message to the site's owner", (done) => {
      factory.site({ owner: 'site-owner' })
        .then(site => factory.build({ site }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
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
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'GITHUB_TOKEN')).to.equal('fake-github-token-123');
          done();
        })
        .catch(done);
    });

    it("should set GENERATOR in the message to the site's build engine (e.g. 'jekyll')", (done) => {
      factory.site({ engine: 'hugo' })
        .then(site => factory.build({ site }))
        .then(build => Build.findByPk(build.id, { include: [Site, User] }))
        .then(build => SQS.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'GENERATOR')).to.equal('hugo');
          done();
        })
        .catch(done);
    });

    describe('SKIP_LOGGING', () => {
      const origAppEnv = config.app.app_env;

      after(() => {
        // reset to original value after these test cases
        config.app.app_env = origAppEnv;
      });

      it('should set SKIP_LOGGING to true if the app_env is "development"', (done) => {
        config.app.app_env = 'development';
        factory.site()
          .then(() => factory.build())
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'SKIP_LOGGING')).to.equal(true);
            done();
          })
          .catch(done);
      });

      it('should set SKIP_LOGGING to false if the app_env is not "development"', (done) => {
        config.app.app_env = 'not-development';
        factory.site()
          .then(() => factory.build())
          .then(build => Build.findByPk(build.id, { include: [Site, User] }))
          .then(build => SQS.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'SKIP_LOGGING')).to.equal(false);
            done();
          })
          .catch(done);
      });
    });
  });
});
