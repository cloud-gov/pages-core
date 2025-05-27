const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const apiConfig = require('../../../../config');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const SiteCreator = require('../../../../api/services/SiteCreator');
const TemplateResolver = require('../../../../api/services/TemplateResolver');
const { Build, Site, SiteBranchConfig } = require('../../../../api/models');
const QueueJobs = require('../../../../api/queue-jobs');
const utils = require('../../../../api/utils');

describe('SiteCreator', () => {
  beforeEach(() => {
    sinon.stub(QueueJobs.prototype, 'startSiteBuild').resolves();
    sinon.stub(utils, 'generateS3ServiceName').callsFake((owner, repo) => {
      if (!owner || !repo) return undefined;
      return `o-${owner}-r-${repo}`;
    });
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('.createSite', () => {
    const validateSiteExpectations = (
      site,
      owner,
      repository,
      user,
      defaultBranch = 'main',
      s3ServiceName = 'federalist-dev-s3',
      awsBucketName = 'cg-123456789',
      awsBucketRegion = 'us-gov-west-1',
    ) => {
      expect(site).to.not.be.undefined;
      expect(site.owner).to.equal(owner);
      expect(site.repository).to.equal(repository);
      expect(site.s3ServiceName).to.equal(s3ServiceName);
      expect(site.awsBucketName).to.equal(awsBucketName);
      expect(site.awsBucketRegion).to.equal(awsBucketRegion);
      expect(site.Builds).to.have.length(1);
      expect(site.Builds[0].user).to.equal(user.id);
      expect(site.SiteBranchConfigs[0].branch).to.equal(defaultBranch);
      expect(site.webhookId).to.not.be.null;
    };

    const afterCreateSite = (owner, repository) =>
      Site.findOne({
        where: {
          owner,
          repository,
        },
        include: [Build, SiteBranchConfig],
      });

    context('from a GitHub repo', () => {
      let siteParams, name;

      beforeEach(() => {
        siteParams = {
          owner: crypto.randomBytes(10).toString('hex'),
          repository: crypto.randomBytes(10).toString('hex'),
        };

        name = `o-${siteParams.owner}-r-${siteParams.repository}`;

        const keyName = `${name}-key`;
        const planName = 'basic-vpc';
        const planGuid = 'plan-guid';
        const bucketGuid = 'bucket-guid';
        const accessKeyId = crypto.randomBytes(10).toString('hex');
        const secretAccessKey = crypto.randomBytes(10).toString('hex');
        const region = 'us-gov-other-1';
        const bucket = 'testing-bucket';

        const instanceRequestBody = {
          name,
          service_plan_guid: planGuid,
        };
        const keyRequestBody = {
          name: keyName,
          serviceInstanceGuid: bucketGuid,
        };

        const planResponses = factory.createCFAPIResourceList({
          resources: [
            factory.createCFAPIResource({
              guid: planGuid,
              name: planName,
            }),
          ],
        });
        const bucketResponse = factory.createCFAPIResource({
          guid: bucketGuid,
          name,
        });

        const keyResponse = factory.createCFAPIResource({
          name: keyName,
          serviceInstanceGuid: bucketGuid,
        });

        const keyCredentials = factory.responses.credentials({
          access_key_id: accessKeyId,
          secret_access_key: secretAccessKey,
          region,
          bucket,
        });

        const serviceInstanceResponses = factory.createCFAPIResourceList({
          resources: [
            factory.createCFAPIResource({
              name,
              guid: bucketGuid,
            }),
          ],
        });

        const buildResponses = factory.createCFAPIResourceList({
          resources: [
            factory.createCFAPIResource({
              name,
              service_instance_guid: bucketGuid,
            }),
          ],
        });

        mockTokenRequest();
        apiNocks.mockFetchS3ServicePlanGUID(planResponses, planName);
        apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
        apiNocks.mockFetchServiceInstancesRequest(serviceInstanceResponses, name);
        apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
        apiNocks.mockFetchServiceInstancesRequest(buildResponses);
        apiNocks.mockFetchServiceInstanceCredentialsRequest(name, {
          guid: keyResponse.guid,
          credentials: keyCredentials,
        });
      });

      let user;
      let webhookNock;

      const setupWebhook = (accessToken, owner, repo) =>
        githubAPINocks.webhook({
          accessToken,
          owner,
          repo,
        });

      context('when the owner of the repo is an authorized federalist org', () => {
        it(`creates new site record for the given repository,
            adds the webhook and build`, (done) => {
          const defaultBranch = 'myDefaultBranch';

          factory
            .user()
            .then((model) => {
              user = model;
              githubAPINocks.repo({
                defaultBranch,
              });

              githubAPINocks.userOrganizations({
                accessToken: user.githubAccessToken,
                organizations: [
                  {
                    login: siteParams.owner,
                  },
                ],
              });

              webhookNock = setupWebhook(
                user.githubAccessToken,
                siteParams.owner,
                siteParams.repository,
              );

              return SiteCreator.createSite({
                user,
                siteParams,
              });
            })
            .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
            .then((site) => {
              validateSiteExpectations(
                site,
                siteParams.owner,
                siteParams.repository,
                user,
                defaultBranch,
                name,
                'testing-bucket',
                'us-gov-other-1',
              );
              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });

        it('ignores case when comparing org name', (done) => {
          const defaultBranch = 'myDefaultBranch';

          factory
            .user()
            .then((model) => {
              user = model;
              githubAPINocks.repo({
                defaultBranch,
              });
              githubAPINocks.webhook();

              githubAPINocks.userOrganizations({
                accessToken: user.githubAccessToken,
                organizations: [
                  {
                    login: siteParams.owner.toUpperCase(),
                  },
                ],
              });

              return SiteCreator.createSite({
                user,
                siteParams,
              });
            })
            .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
            .then((site) => {
              validateSiteExpectations(
                site,
                siteParams.owner,
                siteParams.repository,
                user,
                defaultBranch,
                name,
                'testing-bucket',
                'us-gov-other-1',
              );
              done();
            })
            .catch(done);
        });
      });

      it('should reject if the user does not have admin access to the site', (done) => {
        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.repo({
              accessToken: user.accessToken,
              owner: siteParams.owner,
              repo: siteParams.repository,
              response: [
                200,
                {
                  permissions: {
                    admin: false,
                    push: true,
                  },
                },
              ],
            });
            return SiteCreator.createSite({
              user,
              siteParams,
            });
          })
          .catch((err) => {
            expect(err.status).to.equal(400);
            expect(err.message).to.equal(
              'You do not have admin access to this repository',
            );
            done();
          });
      });

      it('should reject if the site already exists in an organization', async () => {
        const org = await factory.organization.create();
        const [site, user] = await Promise.all([
          factory.site({ organizationId: org.id }),
          factory.user(),
        ]);

        const siteParams = {
          owner: site.owner,
          repository: site.repository,
          organizationId: org.id,
        };

        const error = await SiteCreator.createSite({
          user: user,
          siteParams,
        }).catch((e) => e);

        expect(error.status).to.equal(400);
        expect(error.message).to.equal(
          `This site has already been added to ${apiConfig.app.appName}.`,
        );
      });

      it('should reject if the GitHub repository does not exist', (done) => {
        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.repo({
              accessToken: user.accessToken,
              org: siteParams.owner,
              repo: siteParams.repository,
              response: [
                404,
                {
                  message: 'Not Found',
                },
              ],
            });
            return SiteCreator.createSite({
              user,
              siteParams,
            });
          })
          .catch((err) => {
            expect(err.status).to.eq(400);
            expect(err.message).to.eq(
              // eslint-disable-next-line max-len
              `The repository ${siteParams.owner}/${siteParams.repository} does not exist.`,
            );
            done();
          })
          .catch(done);
      });

      // eslint-disable-next-line max-len
      it('rejects if the org that owns the repo has not authorized federalist', (done) => {
        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.repo();
            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [
                {
                  login: 'some-other-org',
                },
              ],
            });

            return SiteCreator.createSite({
              user,
              siteParams,
            });
          })
          .catch((err) => {
            const expectedError =
              /* eslint-disable max-len */
              `${apiConfig.app.appName} can't confirm org permissions for '${siteParams.owner}'.` +
              `Either '${siteParams.owner}' hasn't approved access for ${apiConfig.app.appName} or you aren't an org member.` +
              `Ensure you are an org member and ask an org owner to authorize ${apiConfig.app.appName} for the organization.`;
            /* eslint-enable max-len */
            expect(err.message).to.equal(expectedError);
            expect(err.status).to.equal(403);
            done();
          });
      });
    });

    context('when the site is created from a template', () => {
      const template = 'uswds-11ty';
      let user;
      let siteParams, name;

      beforeEach(() => {
        siteParams = {
          owner: crypto.randomBytes(10).toString('hex'),
          repository: crypto.randomBytes(10).toString('hex'),
          template,
        };

        name = `o-${siteParams.owner}-r-${siteParams.repository}`;

        const keyName = `${name}-key`;
        const planName = 'basic-vpc';
        const planGuid = 'plan-guid';
        const bucketGuid = 'bucket-guid';
        const accessKeyId = crypto.randomBytes(10).toString('hex');
        const secretAccessKey = crypto.randomBytes(10).toString('hex');
        const region = 'us-gov-other-1';
        const bucket = 'testing-bucket';

        const instanceRequestBody = {
          name,
          service_plan_guid: planGuid,
        };
        const keyRequestBody = {
          name: keyName,
          serviceInstanceGuid: bucketGuid,
        };

        const planResponses = factory.createCFAPIResourceList({
          resources: [
            factory.createCFAPIResource({
              guid: planGuid,
              name: planName,
            }),
          ],
        });
        const bucketResponse = factory.createCFAPIResource({
          guid: bucketGuid,
          name,
        });

        const keyResponse = factory.createCFAPIResource({
          name: keyName,
          serviceInstanceGuid: bucketGuid,
        });

        const keyCredentials = factory.responses.credentials({
          access_key_id: accessKeyId,
          secret_access_key: secretAccessKey,
          region,
          bucket,
        });

        const serviceInstanceResponses = factory.createCFAPIResourceList({
          resources: [
            factory.createCFAPIResource({
              name,
              guid: bucketGuid,
            }),
          ],
        });

        const buildResponses = factory.createCFAPIResourceList({
          resources: [
            factory.createCFAPIResource({
              name,
              service_instance_guid: bucketGuid,
            }),
          ],
        });

        mockTokenRequest();
        apiNocks.mockFetchS3ServicePlanGUID(planResponses, planName);
        apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
        apiNocks.mockFetchServiceInstancesRequest(serviceInstanceResponses, name);
        apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
        apiNocks.mockFetchServiceInstancesRequest(buildResponses);
        apiNocks.mockFetchServiceInstanceCredentialsRequest(name, {
          guid: keyResponse.guid,
          credentials: keyCredentials,
        });
      });

      it(`should create a new site record
          for the given repository`, (done) => {
        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.createRepoUsingTemplate();
            githubAPINocks.webhook();
            return SiteCreator.createSite({
              user,
              siteParams,
            });
          })
          .then(({ site }) => {
            expect(site).to.not.be.undefined;
            expect(site.owner).to.equal(siteParams.owner);
            expect(site.repository).to.equal(siteParams.repository);
            expect(site.defaultBranch).to.equal('main');

            return Site.findOne({
              where: {
                owner: siteParams.owner,
                repository: siteParams.repository,
              },
            });
          })
          .then((site) => {
            expect(site).to.not.be.undefined;
            done();
          })
          .catch(done);
      });

      it('should use node as the build engine', (done) => {
        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.createRepoUsingTemplate();
            githubAPINocks.webhook();
            return SiteCreator.createSite({
              siteParams,
              user,
            });
          })
          .then(({ site }) => {
            expect(site.engine).to.equal('node.js');
            done();
          })
          .catch(done);
      });

      it(`should trigger a build that pushes
          the source repo to the destination repo`, (done) => {
        const templateResolverStub = sinon.stub(TemplateResolver, 'getTemplate');
        const fakeTemplate = {
          repo: 'federalist-template',
          owner: '18f',
          branch: 'not-main',
        };

        templateResolverStub.returns(fakeTemplate);

        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.createRepoUsingTemplate();
            githubAPINocks.webhook();
            return SiteCreator.createSite({
              siteParams,
              user,
            });
          })
          .then(({ site }) =>
            Site.findByPk(site.id, {
              include: [Build],
            }),
          )
          .then((site) => {
            expect(site.Builds).to.have.length(1);
            expect(site.Builds[0].user).to.equal(user.id);
            expect(site.Builds[0].branch).to.equal(site.defaultBranch);

            templateResolverStub.restore();

            done();
          })
          .catch(done);
      });

      it('should create a webhook for the new site', (done) => {
        let webhookNock;

        factory
          .user()
          .then((model) => {
            user = model;
            githubAPINocks.createRepoUsingTemplate();
            webhookNock = githubAPINocks.webhook({
              accessToken: user.githubAccessToken,
              owner: siteParams.owner,
              repo: siteParams.repository,
            });
            return SiteCreator.createSite({
              user,
              siteParams,
            });
          })
          .then(() => {
            expect(webhookNock.isDone()).to.equal(true);
            done();
          })
          .catch(done);
      });

      it('should reject if the repo already exists on GitHub', (done) => {
        factory
          .user()
          .then((model) => {
            user = model;

            githubAPINocks.createRepoUsingTemplate({
              accessToken: user.accessToken,
              owner: siteParams.owner,
              repo: siteParams.repository,
              template: TemplateResolver.getTemplate(template),
              response: [
                422,
                {
                  errors: [
                    {
                      message: 'name already exists on this account',
                    },
                  ],
                },
              ],
            });
            return SiteCreator.createSite({
              user,
              siteParams,
            });
          })
          .catch((err) => {
            expect(err.status).to.equal(400);
            expect(err.message).to.equal('A repo with that name already exists.');
            done();
          })
          .catch(done);
      });

      it('should reject if the template does not exist', (done) => {
        const badSiteParams = {
          owner: crypto.randomBytes(10).toString('hex'),
          repository: crypto.randomBytes(10).toString('hex'),
          template: 'not-a-template',
        };

        factory
          .user()
          .then((model) => {
            user = model;
            return SiteCreator.createSite({
              user,
              siteParams: badSiteParams,
            });
          })
          .catch((err) => {
            expect(err.status).to.eq(400);
            expect(err.message).to.eq('No such template: not-a-template');
            done();
          })
          .catch(done);
      });
    });

    context('with a private S3 bucket', () => {
      let user;
      let webhookNock;

      const setupWebhook = (accessToken, owner, repo) =>
        githubAPINocks.webhook({
          accessToken,
          owner,
          repo,
        });

      describe('for the Pages product', () => {
        it(`creates new bucket and site record for the given repository,
            adds the user, webhook, and build`, (done) => {
          const siteParams = {
            owner: crypto.randomBytes(10).toString('hex'),
            repository: crypto.randomBytes(10).toString('hex'),
            sharedBucket: false,
          };

          const name = `o-${siteParams.owner}-r-${siteParams.repository}`;
          const keyName = `${name}-key`;
          const planName = 'basic-vpc';
          const planGuid = 'plan-guid';
          const bucketGuid = 'bucket-guid';
          const accessKeyId = crypto.randomBytes(10).toString('hex');
          const secretAccessKey = crypto.randomBytes(10).toString('hex');
          const region = 'us-gov-other-1';
          const bucket = 'testing-bucket';

          const instanceRequestBody = {
            name,
            service_plan_guid: planGuid,
          };
          const keyRequestBody = {
            name: keyName,
            serviceInstanceGuid: bucketGuid,
          };

          const planResponses = factory.createCFAPIResourceList({
            resources: [
              factory.createCFAPIResource({
                guid: planGuid,
                name: planName,
              }),
            ],
          });
          const bucketResponse = factory.createCFAPIResource({
            guid: bucketGuid,
            name,
          });

          const keyResponse = factory.createCFAPIResource({
            name: keyName,
            serviceInstanceGuid: bucketGuid,
          });

          const keyCredentials = factory.responses.credentials({
            access_key_id: accessKeyId,
            secret_access_key: secretAccessKey,
            region,
            bucket,
          });

          const serviceInstanceResponses = factory.createCFAPIResourceList({
            resources: [
              factory.createCFAPIResource({
                name,
                guid: bucketGuid,
              }),
            ],
          });

          const buildResponses = factory.createCFAPIResourceList({
            resources: [
              factory.createCFAPIResource({
                name,
                service_instance_guid: bucketGuid,
              }),
            ],
          });

          mockTokenRequest();
          apiNocks.mockFetchS3ServicePlanGUID(planResponses, planName);
          apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
          apiNocks.mockFetchServiceInstancesRequest(serviceInstanceResponses, name);
          apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
          apiNocks.mockFetchServiceInstancesRequest(buildResponses);
          apiNocks.mockFetchServiceInstanceCredentialsRequest(name, {
            guid: keyResponse.guid,
            credentials: keyCredentials,
          });

          factory
            .user()
            .then((model) => {
              user = model;
              githubAPINocks.repo();

              githubAPINocks.userOrganizations({
                accessToken: user.githubAccessToken,
                organizations: [
                  {
                    login: siteParams.owner,
                  },
                ],
              });

              webhookNock = setupWebhook(
                user.githubAccessToken,
                siteParams.owner,
                siteParams.repository,
              );

              return SiteCreator.createSite({
                user,
                siteParams,
              });
            })
            .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
            .then((site) => {
              validateSiteExpectations(
                site,
                siteParams.owner,
                siteParams.repository,
                user,
                'main',
                name,
                bucket,
                region,
              );
              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });
      });
    });
  });
});
