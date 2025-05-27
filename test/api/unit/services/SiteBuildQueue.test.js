const nock = require('nock');
const { expect } = require('chai');
const sinon = require('sinon');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const config = require('../../../../config');
const factory = require('../../support/factory');
const { createSiteUserOrg } = require('../../support/site-user');
const GithubBuildHelper = require('../../../../api/services/GithubBuildHelper');
const SiteBuildQueue = require('../../../../api/services/SiteBuildQueue');
const {
  Build,
  Domain,
  Site,
  SiteBranchConfig,
  User,
  UserEnvironmentVariable,
} = require('../../../../api/models');
const CFApiClient = require('../../../../api/utils/cfApiClient');
const S3Helper = require('../../../../api/services/S3Helper');

describe('SiteBuildQueue', () => {
  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
    return Site.truncate({
      force: true,
      cascade: true,
    });
  });

  beforeEach(() => {
    mockTokenRequest();
    apiNocks.mockDefaultCredentials();
  });

  describe('.messageBodyForBuild(build)', () => {
    const messageEnv = (message, name) => {
      const element = message.environment.find((el) => el.name === name);
      if (element) {
        return element.value;
      }
      return null;
    };

    it('should set the correct AWS credentials in the message', (done) => {
      factory
        .build()
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig],
              },
              User,
            ],
          }),
        )
        .then((build) => SiteBuildQueue.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'AWS_ACCESS_KEY_ID')).to.equal(
            config.s3.accessKeyId,
          );
          expect(messageEnv(message, 'AWS_SECRET_ACCESS_KEY')).to.equal(
            config.s3.secretAccessKey,
          );
          expect(messageEnv(message, 'AWS_DEFAULT_REGION')).to.equal(config.s3.region);
          expect(messageEnv(message, 'BUCKET')).to.equal(config.s3.bucket);
          done();
        })
        .catch(done);
    });

    it('should set STATUS_CALLBACK in the message', (done) => {
      factory
        .build()
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig],
              },
              User,
            ],
          }),
        )
        .then((build) =>
          SiteBuildQueue.messageBodyForBuild(build).then((message) => {
            expect(messageEnv(message, 'STATUS_CALLBACK')).to.equal(
              `http://${config.app.domain}/v0/build/${build.id}/status/${build.token}`,
            );
            done();
          }),
        )
        .catch(done);
    });

    it('should set USER_ENVIRONMENT_VARIABLES in the message when present', (done) => {
      factory
        .build()
        .then((build) =>
          factory.userEnvironmentVariable
            .create({
              site: {
                id: build.site,
              },
            })
            .then(() => build),
        )
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                include: [UserEnvironmentVariable, SiteBranchConfig, Domain],
              },
              User,
            ],
          }),
        )
        .then((build) => {
          return SiteBuildQueue.messageBodyForBuild(build).then((message) => {
            const uevs = build.Site.UserEnvironmentVariables.map((uev) => ({
              name: uev.name,
              ciphertext: uev.ciphertext,
            }));
            expect(
              JSON.parse(messageEnv(message, 'USER_ENVIRONMENT_VARIABLES')),
            ).to.deep.eq(uevs);
            done();
          });
        })
        .catch(done);
    });

    it('should set USER_ENVIRONMENT_VARIABLES to an empty array when absent', (done) => {
      factory
        .build()
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                include: [UserEnvironmentVariable, SiteBranchConfig, Domain],
              },
              User,
            ],
          }),
        )
        .then((build) => {
          return SiteBuildQueue.messageBodyForBuild(build).then((message) => {
            expect(
              JSON.parse(messageEnv(message, 'USER_ENVIRONMENT_VARIABLES')),
            ).to.deep.eq([]);
            done();
          });
        })
        .catch(done);
    });

    context("building a site's default branch", () => {
      it(`should set an empty string for BASEURL
          in the message for a site with a custom domain`, (done) => {
        const branch = 'main';
        const domains = ['https://example.com', 'https://example.com/'];

        const baseurlPromises = domains.map((domain) =>
          factory
            .site({
              domain,
              defaultBranch: branch,
            })
            .then((site) => {
              const sbc = site.SiteBranchConfigs.find((c) => c.branch === branch);

              return Promise.all([
                factory.build({
                  site,
                  branch,
                }),
                factory.domain.create({
                  siteId: site.id,
                  siteBranchConfigId: sbc.id,
                  state: 'provisioned',
                }),
              ]);
            })
            .then(([build]) =>
              Build.findByPk(build.id, {
                include: [
                  {
                    model: Site,
                    required: true,
                    include: [SiteBranchConfig, Domain],
                  },
                  User,
                ],
              }),
            )
            .then((build) => SiteBuildQueue.messageBodyForBuild(build))
            .then((message) => messageEnv(message, 'BASEURL')),
        );

        Promise.all(baseurlPromises)
          .then((baseurls) => {
            expect(baseurls).to.deep.equal(Array(domains.length).fill(''));
            done();
          })
          .catch(done);
      });

      it(`it should set BASEURL in the message
          for a site without a custom domain`, (done) => {
        factory
          .site({
            domain: '',
            owner: 'owner',
            repository: 'repo',
            defaultBranch: 'main',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'main',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/site/owner/repo');
            done();
          })
          .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'site/:owner/:repo/'", (done) => {
        factory
          .site({
            domain: '',
            owner: 'owner',
            repository: 'repo',
            defaultBranch: 'main',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'main',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'SITE_PREFIX')).to.equal('site/owner/repo');
            done();
          })
          .catch(done);
      });
    });

    context("building a site's demo branch", () => {
      it(`should set an empty string for
          BASEURL in the message for a site with a demo domain`, (done) => {
        const branch = 'demo';
        const domains = ['https://example.com', 'https://example.com/'];

        const baseurlPromises = domains.map((domain) =>
          factory
            .site({
              demoDomain: domain,
              demoBranch: branch,
            })
            .then((site) => {
              const sbc = site.SiteBranchConfigs.find((c) => c.branch === branch);

              return Promise.all([
                factory.build({
                  site,
                  branch,
                }),
                factory.domain.create({
                  siteId: site.id,
                  siteBranchConfigId: sbc.id,
                  state: 'provisioned',
                }),
              ]);
            })
            .then(([build]) =>
              Build.findByPk(build.id, {
                include: [
                  {
                    model: Site,
                    required: true,
                    include: [SiteBranchConfig, Domain],
                  },
                  User,
                ],
              }),
            )
            .then((build) => SiteBuildQueue.messageBodyForBuild(build))
            .then((message) => messageEnv(message, 'BASEURL')),
        );

        Promise.all(baseurlPromises)
          .then((baseurls) => {
            expect(baseurls).to.deep.equal(Array(domains.length).fill(''));
            done();
          })
          .catch(done);
      });

      it(`it should set BASEURL in the message
          for a site without a demo domain`, (done) => {
        factory
          .site({
            demoDomain: '',
            owner: 'owner',
            repository: 'repo',
            demoBranch: 'demo',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'demo',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/demo/owner/repo');
            done();
          })
          .catch(done);
      });

      it("should set SITE_PREFIX in the message to 'demo/:owner/:repo'", (done) => {
        factory
          .site({
            demoDomain: '',
            owner: 'owner',
            repository: 'repo',
            demoBranch: 'demo',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'demo',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
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
            defaultBranch: 'main',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'branch',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/preview/owner/repo/branch');
            done();
          })
          .catch(done);
      });

      it(`should set BASEURL in the message
          for a site without a custom domain`, (done) => {
        factory
          .site({
            domain: '',
            owner: 'owner',
            repository: 'repo',
            defaultBranch: 'main',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'branch',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'BASEURL')).to.equal('/preview/owner/repo/branch');
            done();
          })
          .catch(done);
      });

      it(`should set SITE_PREFIX in the message
          to 'preview/:owner/:repo/:branch'`, (done) => {
        factory
          .site({
            domain: '',
            owner: 'owner',
            repository: 'repo',
            defaultBranch: 'main',
          })
          .then((site) =>
            factory.build({
              site,
              branch: 'branch',
            }),
          )
          .then((build) =>
            Build.findByPk(build.id, {
              include: [
                {
                  model: Site,
                  required: true,
                  include: [SiteBranchConfig, Domain],
                },
                User,
              ],
            }),
          )
          .then((build) => SiteBuildQueue.messageBodyForBuild(build))
          .then((message) => {
            expect(messageEnv(message, 'SITE_PREFIX')).to.equal(
              'preview/owner/repo/branch',
            );
            done();
          })
          .catch(done);
      });
    });

    it("should set BRANCH in the message to the name build's branch", (done) => {
      factory
        .site({
          domain: '',
          defaultBranch: 'main',
        })
        .then((site) =>
          factory.build({
            site,
            branch: 'branch',
          }),
        )
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig, Domain],
              },
              User,
            ],
          }),
        )
        .then((build) => SiteBuildQueue.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'BRANCH')).to.equal('branch');
          done();
        })
        .catch(done);
    });

    it(`should set CONFIG in the message to the
        YAML config for the site on the default branch`, async () => {
      const branch = 'main';
      const config = {
        plugins_dir: '_plugins',
      };
      const diffBranch = 'diff-branch';
      const diffConfig = {
        different: 'config',
      };
      const site = await factory.site(undefined, {
        noSiteBranchConfig: true,
      });

      await factory.siteBranchConfig.create({
        site,
        branch,
        config,
      });
      await factory.siteBranchConfig.create({
        site,
        branch: diffBranch,
        config: diffConfig,
      });

      const build = await factory.build({
        site,
        branch,
      });
      const buildRecord = await Build.findByPk(build.id, {
        include: [
          {
            model: Site,
            required: true,
            include: [SiteBranchConfig, Domain],
          },
          User,
        ],
      });
      const message = await SiteBuildQueue.messageBodyForBuild(buildRecord);

      expect(messageEnv(message, 'CONFIG')).to.equal(JSON.stringify(config));
    });

    it(`should return the preview CONFIG
        if the branch does not have a specific config`, async () => {
      const branch = 'main';
      const config = {
        plugins_dir: '_plugins',
      };
      const previewBranch = 'preview';
      const previewConfig = {
        preview: 'config',
      };
      const site = await factory.site(undefined, {
        noSiteBranchConfig: true,
      });

      await factory.siteBranchConfig.create({
        site,
        branch,
        config,
        context: 'site',
      });
      await factory.siteBranchConfig.create({
        site,
        config: previewConfig,
        context: 'preview',
      });

      const build = await factory.build({
        site,
        branch: previewBranch,
      });
      const buildRecord = await Build.findByPk(build.id, {
        include: [
          {
            model: Site,
            required: true,
            include: [SiteBranchConfig, Domain],
          },
          User,
        ],
      });
      const message = await SiteBuildQueue.messageBodyForBuild(buildRecord);

      expect(messageEnv(message, 'CONFIG')).to.equal(JSON.stringify(previewConfig));
    });

    it("should set REPOSITORY in the message to the site's repo name", (done) => {
      factory
        .site({
          repository: 'site-repo',
        })
        .then((site) =>
          factory.build({
            site,
          }),
        )
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig, Domain],
              },
              User,
            ],
          }),
        )
        .then((build) => SiteBuildQueue.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'REPOSITORY')).to.equal('site-repo');
          done();
        })
        .catch(done);
    });

    it("should set OWNER in the message to the site's owner", (done) => {
      factory
        .site({
          owner: 'site-owner',
        })
        .then((site) =>
          factory.build({
            site,
          }),
        )
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig],
              },
              User,
            ],
          }),
        )
        .then((build) => SiteBuildQueue.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'OWNER')).to.equal('site-owner');
          done();
        })
        .catch(done);
    });

    it(`should set GITHUB_TOKEN in the
        message to the user's GitHub access token`, async () => {
      const user = await factory.user({
        githubAccessToken: 'fake-github-token-123',
      });
      const { site } = await createSiteUserOrg({ user });
      const build = await factory.build({
        user,
        site,
      });

      const fullBuild = await Build.findByPk(build.id, {
        include: [
          {
            model: Site,
            required: true,
            include: [SiteBranchConfig],
          },
          User,
        ],
      });

      const message = await SiteBuildQueue.messageBodyForBuild(fullBuild);
      expect(messageEnv(message, 'GITHUB_TOKEN')).to.equal('fake-github-token-123');
    });

    it(`should find a github access token
        for a site user when the current user does not have one`, async () => {
      const user1 = await factory.user({
        githubAccessToken: null,
      });
      const { site, user: user2, org } = await createSiteUserOrg();
      await org.addRoleUser(user1);

      const build = await factory.build({
        user: user1,
        site,
      });
      await build.reload({
        include: [
          {
            model: Site,
            required: true,
            include: [SiteBranchConfig],
          },
          User,
        ],
      });

      sinon
        .stub(GithubBuildHelper, 'loadBuildUserAccessToken')
        .resolves(user2.githubAccessToken);

      const message = await SiteBuildQueue.messageBodyForBuild(build);

      expect(messageEnv(message, 'GITHUB_TOKEN')).to.equal(user2.githubAccessToken);
    });

    it(`should set GENERATOR in the message
        to the site's build engine (e.g. 'jekyll')`, (done) => {
      factory
        .site({
          engine: 'hugo',
        })
        .then((site) =>
          factory.build({
            site,
          }),
        )
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig],
              },
              User,
            ],
          }),
        )
        .then((build) => SiteBuildQueue.messageBodyForBuild(build))
        .then((message) => {
          expect(messageEnv(message, 'GENERATOR')).to.equal('hugo');
          done();
        })
        .catch(done);
    });

    it('should set containerName and containerSize in the message', () => {
      const containerConfig = {
        name: 'default',
        size: 'large',
      };
      return factory
        .site({
          containerConfig,
        })
        .then((site) =>
          factory.build({
            site,
          }),
        )
        .then((build) =>
          Build.findByPk(build.id, {
            include: [
              {
                model: Site,
                required: true,
                include: [SiteBranchConfig],
              },
              User,
            ],
          }),
        )
        .then((build) => SiteBuildQueue.messageBodyForBuild(build))
        .then((message) => {
          expect(message.containerName).to.deep.equal(containerConfig.name);
          expect(message.containerSize).to.deep.equal(containerConfig.size);
        });
    });
  });

  describe('.setupBucket', () => {
    it(`should immediately return true
        if there are more than one site builds`, async () => {
      const build = {};
      const buildCount = 2;

      const setupSuccess = await SiteBuildQueue.setupBucket(build, buildCount);
      expect(setupSuccess).to.equal(true);
    });

    it('should verify the site bucket is available', async () => {
      const buildCount = 1;
      const stubCreds = sinon.stub(
        CFApiClient.prototype,
        'fetchServiceInstanceCredentials',
      );
      const stubS3 = sinon.stub(S3Helper.S3Client.prototype, 'waitForBucket').resolves();
      const factoryBuild = await factory.build();
      const build = await Build.findByPk(factoryBuild.id, {
        include: [
          {
            model: Site,
            required: true,
            include: [SiteBranchConfig, Domain],
          },
          User,
        ],
      });
      const creds = {
        access_key_id: 'access_key_id',
        bucket: build.bucket,
        region: 'region',
        secret_access_key: 'secret',
      };
      stubCreds.resolves(creds);
      stubS3.resolves();

      const setupSuccess = await SiteBuildQueue.setupBucket(build, buildCount);
      expect(setupSuccess).to.equal(true);
      sinon.assert.calledOnceWithExactly(stubCreds, build.Site.s3ServiceName);
      sinon.assert.calledOnce(stubS3);
    });
  });

  describe('.setupTaskEnv', () => {
    it(`should find the build and
        associated tables to setup the cf task dev`, async () => {
      const factoryBuild = await factory.build();
      const stub = sinon.stub(SiteBuildQueue, 'setupBucket');
      stub.resolves();

      const { build, message } = await SiteBuildQueue.setupTaskEnv(factoryBuild.id);

      expect(build.id).to.equal(factoryBuild.id);
      expect(message.environment).to.be.an('array');
      message.environment.forEach((i) => {
        if (i.name === 'BRANCH') {
          expect(i.value).to.equal(build.branch);
        }
      });
      sinon.assert.calledOnceWithExactly(stub, build, 1);
    });

    it(`should find the build with
        multiple site builds to setup the cf task dev`, async () => {
      const site = await factory.site();
      const fb1 = await factory.build({
        site,
      });
      await factory.build({
        site,
      });
      const stub = sinon.stub(SiteBuildQueue, 'setupBucket');
      stub.resolves();

      const { build, message } = await SiteBuildQueue.setupTaskEnv(fb1.id);

      expect(build.id).to.equal(fb1.id);
      expect(message.environment).to.be.an('array');
      sinon.assert.calledOnceWithExactly(stub, build, 2);
    });
  });
});
