const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const config = require('../../../../config/env/test');
const apiConfig = require('../../../../config');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const SiteCreator = require('../../../../api/services/SiteCreator');
const TemplateResolver = require('../../../../api/services/TemplateResolver');
const { Build, Site, User } = require('../../../../api/models');
const SiteBuildQueue = require('../../../../api/services/SiteBuildQueue');

describe('SiteCreator', () => {
  beforeEach(() => {
    sinon.stub(SiteBuildQueue, 'sendBuildMessage').resolves();
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
      awsBucketRegion = 'us-gov-west-1'
    ) => {
      expect(site).to.not.be.undefined;
      expect(site.owner).to.equal(owner);
      expect(site.repository).to.equal(repository);
      expect(site.s3ServiceName).to.equal(s3ServiceName);
      expect(site.awsBucketName).to.equal(awsBucketName);
      expect(site.awsBucketRegion).to.equal(awsBucketRegion);
      expect(site.Users).to.have.length(1);
      expect(site.Users[0].id).to.equal(user.id);
      expect(site.Builds).to.have.length(1);
      expect(site.Builds[0].user).to.equal(user.id);
      expect(site.defaultBranch).to.equal(defaultBranch);
      expect(site.webhookId).to.not.be.null;
    };

    const afterCreateSite = (owner, repository) => Site.findOne({
      where: {
        owner,
        repository,
      },
      include: [User, Build],
    });

    context('from a GitHub repo', () => {
      let siteParams, name;

      beforeEach(() => {
        siteParams = {
          owner: crypto.randomBytes(10).toString("hex"),
          repository: crypto.randomBytes(10).toString("hex"),
        };

        name = `o-${siteParams.owner}-r-${siteParams.repository}`;

        const routeGuid = "route-12345";
        const keyName = `${name}-key`;
        const planName = "basic-vpc";
        const planGuid = "plan-guid";
        const bucketGuid = "bucket-guid";
        const accessKeyId = crypto.randomBytes(10).toString("hex");
        const secretAccessKey = crypto.randomBytes(10).toString("hex");
        const region = "us-gov-other-1";
        const bucket = "testing-bucket";

        const instanceRequestBody = { name, service_plan_guid: planGuid };
        const keyRequestBody = { name, service_instance_guid: bucketGuid };

        const planResponses = {
          resources: [
            factory.responses.service({ guid: planGuid }, { name: planName }),
          ],
        };
        const bucketResponse = factory.responses.service(
          { guid: bucketGuid },
          { name }
        );
        const keyResponse = factory.responses.service(
          {},
          {
            name: keyName,
            service_instance_guid: bucketGuid,
            credentials: factory.responses.credentials({
              access_key_id: accessKeyId,
              secret_access_key: secretAccessKey,
              region,
              bucket,
            }),
          }
        );

        const buildResponses = {
          resources: [
            factory.responses.service(
              {},
              {
                name,
                service_instance_guid: bucketGuid,
                credentials: factory.responses.credentials({
                  access_key_id: accessKeyId,
                  secret_access_key: secretAccessKey,
                  region,
                  bucket,
                }),
              }
            ),
          ],
        };

        const serviceCredentialsResponses = {
          resources: [keyResponse],
        };

        const routeResponse = factory.responses.service({ guid: routeGuid });

        mockTokenRequest();
        apiNocks.mockFetchS3ServicePlanGUID(planResponses);
        apiNocks.mockCreateS3ServiceInstance(
          instanceRequestBody,
          bucketResponse
        );
        apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
        apiNocks.mockFetchServiceInstancesRequest(buildResponses);
        apiNocks.mockFetchServiceInstanceCredentialsRequest(
          "test-guid",
          serviceCredentialsResponses
        );
        apiNocks.mockCreateRoute(routeResponse, {
          domain_guid: config.env.cfDomainGuid,
          space_guid: config.env.cfSpaceGuid,
          host: bucket,
        });
      });

      let user;
      let webhookNock;

      const setupWebhook = (accessToken, owner, repo) => githubAPINocks.webhook({
        accessToken,
        owner,
        repo,
      });

      context('when the owner of the repo is an authorized federalist org', () => {
        it('creates new site record for the given repository, adds the user, webhook, and build', (done) => {
          const defaultBranch = 'myDefaultBranch';

          factory.user().then((model) => {
            user = model;
            githubAPINocks.repo({ defaultBranch });

            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [{ login: siteParams.owner }],
            });

            webhookNock = setupWebhook(
              user.githubAccessToken,
              siteParams.owner,
              siteParams.repository
            );

            return SiteCreator.createSite({ user, siteParams });
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
                "testing-bucket",
                "us-gov-other-1"
              );
              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });

        it('ignores case when comparing org name', (done) => {
          const defaultBranch = 'myDefaultBranch';

          factory.user().then((model) => {
            user = model;
            githubAPINocks.repo({ defaultBranch });
            githubAPINocks.webhook();

            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [{ login: siteParams.owner.toUpperCase() }],
            });

            return SiteCreator.createSite({ user, siteParams });
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
                "testing-bucket",
                "us-gov-other-1"
              );
              done();
            })
            .catch(done);
        });
      });

      context('when the user that owns the repo is a federalist user', () => {
        it('creates new site record for the given repository, adds the user, webhook, and build', (done) => {
          factory.user().then((model) => {
            user = model;
            siteParams.owner = user.username;
            name = `o-${siteParams.owner}-r-${siteParams.repository}`;

            githubAPINocks.repo();
            webhookNock = setupWebhook(
              user.githubAccessToken,
              siteParams.owner,
              siteParams.repository
            );

            return SiteCreator.createSite({ user, siteParams });
          })
            .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
            .then((site) => {
              validateSiteExpectations(
                site,
                siteParams.owner,
                siteParams.repository,
                user,
                undefined,
                name,
                "testing-bucket",
                "us-gov-other-1"
              );

              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });
      });

      it('should reject if the user does not have admin access to the site', (done) => {
        factory.user().then((model) => {
          user = model;
          githubAPINocks.repo({
            accessToken: user.accessToken,
            owner: siteParams.owner,
            repo: siteParams.repository,
            response: [200, {
              permissions: {
                admin: false,
                push: true,
              },
            }],
          });
          return SiteCreator.createSite({ user, siteParams });
        }).catch((err) => {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('You do not have admin access to this repository');
          done();
        });
      });

      it('should reject if the site already exists in Federalist', (done) => {
        Promise.props({ site: factory.site(), user: factory.user() })
          .then((values) => {
            const siteParams = {
              owner: values.site.owner,
              repository: values.site.repository,
            };
            return SiteCreator.createSite({ user: values.user, siteParams });
          }).catch((err) => {
            expect(err.status).to.equal(400);
            expect(err.message).to.equal(`This site has already been added to ${apiConfig.app.appName}.`);
            done();
          }).catch(done);
      });

      it('should reject if the GitHub repository does not exist', (done) => {
        factory.user().then((model) => {
          user = model;
          githubAPINocks.repo({
            accessToken: user.accessToken,
            org: siteParams.owner,
            repo: siteParams.repository,
            response: [404, { message: 'Not Found' }],
          });
          return SiteCreator.createSite({ user, siteParams });
        }).catch((err) => {
          expect(err.status).to.eq(400);
          expect(err.message).to.eq(`The repository ${siteParams.owner}/${siteParams.repository} does not exist.`);
          done();
        }).catch(done);
      });

      it('rejects if the org that owns the repo has not authorized federalist', (done) => {
        factory.user()
          .then((model) => {
            user = model;
            githubAPINocks.repo();
            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [{ login: 'some-other-org' }],
            });

            return SiteCreator.createSite({ user, siteParams });
          })
          .catch((err) => {
            const expectedError = `${apiConfig.app.appName} can't confirm org permissions for '${siteParams.owner}'.`
            + `Either '${siteParams.owner}' hasn't approved access for ${apiConfig.app.appName} or you aren't an org member.`
            + `Ensure you are an org member and ask an org owner to authorize ${apiConfig.app.appName} for the organization.`;

            expect(err.message).to.equal(expectedError);
            expect(err.status).to.equal(403);
            done();
          });
      });
    });

    context('when the site is created from a template', () => {
      const template = 'uswds-jekyll';
      let user;
      let siteParams, name;

      beforeEach(() => {
        siteParams = {
          owner: crypto.randomBytes(10).toString("hex"),
          repository: crypto.randomBytes(10).toString("hex"),
          template,
        };

        name = `o-${siteParams.owner}-r-${siteParams.repository}`;

        const routeGuid = "route-12345";
        const keyName = `${name}-key`;
        const planName = "basic-vpc";
        const planGuid = "plan-guid";
        const bucketGuid = "bucket-guid";
        const accessKeyId = crypto.randomBytes(10).toString("hex");
        const secretAccessKey = crypto.randomBytes(10).toString("hex");
        const region = "us-gov-other-1";
        const bucket = "testing-bucket";

        const instanceRequestBody = { name, service_plan_guid: planGuid };
        const keyRequestBody = { name, service_instance_guid: bucketGuid };

        const planResponses = {
          resources: [
            factory.responses.service({ guid: planGuid }, { name: planName }),
          ],
        };
        const bucketResponse = factory.responses.service(
          { guid: bucketGuid },
          { name }
        );
        const keyResponse = factory.responses.service(
          {},
          {
            name: keyName,
            service_instance_guid: bucketGuid,
            credentials: factory.responses.credentials({
              access_key_id: accessKeyId,
              secret_access_key: secretAccessKey,
              region,
              bucket,
            }),
          }
        );

        const buildResponses = {
          resources: [
            factory.responses.service(
              {},
              {
                name,
                service_instance_guid: bucketGuid,
                credentials: factory.responses.credentials({
                  access_key_id: accessKeyId,
                  secret_access_key: secretAccessKey,
                  region,
                  bucket,
                }),
              }
            ),
          ],
        };

        const serviceCredentialsResponses = {
          resources: [keyResponse],
        };

        const routeResponse = factory.responses.service({ guid: routeGuid });

        mockTokenRequest();
        apiNocks.mockFetchS3ServicePlanGUID(planResponses);
        apiNocks.mockCreateS3ServiceInstance(
          instanceRequestBody,
          bucketResponse
        );
        apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
        apiNocks.mockFetchServiceInstancesRequest(buildResponses);
        apiNocks.mockFetchServiceInstanceCredentialsRequest(
          "test-guid",
          serviceCredentialsResponses
        );
        apiNocks.mockCreateRoute(routeResponse, {
          domain_guid: config.env.cfDomainGuid,
          space_guid: config.env.cfSpaceGuid,
          host: bucket,
        });
      });

      it('should create a new site record for the given repository and add the user', (done) => {
        factory.user().then((model) => {
          user = model;
          githubAPINocks.createRepoUsingTemplate();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ user, siteParams });
        }).then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.owner).to.equal(siteParams.owner);
          expect(site.repository).to.equal(siteParams.repository);
          expect(site.defaultBranch).to.equal('main');

          return Site.findOne({
            where: {
              owner: siteParams.owner,
              repository: siteParams.repository,
            },
            include: [User],
          });
        }).then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.Users).to.have.length(1);
          expect(site.Users[0].id).to.equal(user.id);
          done();
        })
          .catch(done);
      });

      it('should use jekyll as the build engine', (done) => {
        factory.user()
          .then((model) => {
            user = model;
            githubAPINocks.createRepoUsingTemplate();
            githubAPINocks.webhook();
            return SiteCreator.createSite({ siteParams, user });
          }).then((site) => {
            expect(site.engine).to.equal('jekyll');
            done();
          }).catch(done);
      });

      it('should trigger a build that pushes the source repo to the destiantion repo', (done) => {
        const templateResolverStub = sinon.stub(TemplateResolver, 'getTemplate');
        const fakeTemplate = {
          repo: 'federalist-template',
          owner: '18f',
          branch: 'not-main',
        };

        templateResolverStub.returns(fakeTemplate);

        factory.user().then((model) => {
          user = model;
          githubAPINocks.createRepoUsingTemplate();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ siteParams, user });
        }).then(site => Site.findByPk(site.id, { include: [Build] })).then((site) => {
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

        factory.user()
          .then((model) => {
            user = model;
            githubAPINocks.createRepoUsingTemplate();
            webhookNock = githubAPINocks.webhook({
              accessToken: user.githubAccessToken,
              owner: siteParams.owner,
              repo: siteParams.repository,
            });
            return SiteCreator.createSite({ user, siteParams });
          })
          .then(() => {
            expect(webhookNock.isDone()).to.equal(true);
            done();
          })
          .catch(done);
      });

      it('should reject if the repo already exists on GitHub', (done) => {
        factory.user()
          .then((model) => {
            user = model;

            githubAPINocks.createRepoUsingTemplate({
              accessToken: user.accessToken,
              owner: siteParams.owner,
              repo: siteParams.repository,
              template: TemplateResolver.getTemplate(template),
              response: [422, {
                errors: [{ message: 'name already exists on this account' }],
              }],
            });
            return SiteCreator.createSite({ user, siteParams });
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

        factory.user()
          .then((model) => {
            user = model;
            return SiteCreator.createSite({ user, siteParams: badSiteParams });
          }).catch((err) => {
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

      const setupWebhook = (accessToken, owner, repo) => githubAPINocks.webhook({
        accessToken,
        owner,
        repo,
      });

      describe('for the Pages product', () => {
        it('creates new bucket and site record for the given repository, adds the user, webhook, and build', (done) => {
          const siteParams = {
            owner: crypto.randomBytes(10).toString('hex'),
            repository: crypto.randomBytes(10).toString('hex'),
            sharedBucket: false,
          };

          const name = `o-${siteParams.owner}-r-${siteParams.repository}`;
          const appGuid = 'app-12345';
          const routeGuid = 'route-12345';
          const keyName = `${name}-key`;
          const planName = 'basic-vpc';
          const planGuid = 'plan-guid';
          const bucketGuid = 'bucket-guid';
          const accessKeyId = crypto.randomBytes(10).toString('hex');
          const secretAccessKey = crypto.randomBytes(10).toString('hex');
          const region = 'us-gov-other-1';
          const bucket = 'testing-bucket';

          const instanceRequestBody = { name, service_plan_guid: planGuid };
          const keyRequestBody = { name, service_instance_guid: bucketGuid };

          const planResponses = {
            resources: [
              factory.responses.service({ guid: planGuid }, { name: planName }),
            ],
          };
          const bucketResponse = factory.responses.service({ guid: bucketGuid }, { name });
          const keyResponse = factory.responses.service({}, {
            name: keyName,
            service_instance_guid: bucketGuid,
            credentials: factory.responses.credentials({
              access_key_id: accessKeyId,
              secret_access_key: secretAccessKey,
              region,
              bucket,
            }),
          });

          const buildResponses = {
            resources: [
              factory.responses.service({}, {
                name,
                service_instance_guid: bucketGuid,
                credentials: factory.responses.credentials({
                  access_key_id: accessKeyId,
                  secret_access_key: secretAccessKey,
                  region,
                  bucket,
                }),
              }),
            ],
          };

          const serviceCredentialsResponses = {
            resources: [keyResponse],
          };

          const routeResponse = factory.responses.service({ guid: routeGuid });

          mockTokenRequest();
          apiNocks.mockFetchS3ServicePlanGUID(planResponses);
          apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
          apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
          apiNocks.mockFetchServiceInstancesRequest(buildResponses);
          apiNocks.mockFetchServiceInstanceCredentialsRequest('test-guid', serviceCredentialsResponses);
          apiNocks.mockCreateRoute(routeResponse, {
            domain_guid: config.env.cfDomainGuid,
            space_guid: config.env.cfSpaceGuid,
            host: bucket,
          });

          factory.user().then((model) => {
            user = model;
            githubAPINocks.repo();

            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [{ login: siteParams.owner }],
            });

            webhookNock = setupWebhook(
              user.githubAccessToken,
              siteParams.owner,
              siteParams.repository
            );

            return SiteCreator.createSite({ user, siteParams });
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
                region
              );
              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });
      });

      describe('for the Federalist product', () => {
        before(() => {
          process.env.PRODUCT = 'federalist'
        })

        before(() => {
          process.env.PRODUCT = 'pages'
        })

        it('creates new bucket and site record for the given repository, adds the user, webhook, and build', (done) => {
          const siteParams = {
            owner: crypto.randomBytes(10).toString('hex'),
            repository: crypto.randomBytes(10).toString('hex'),
            sharedBucket: false,
          };

          const name = `o-${siteParams.owner}-r-${siteParams.repository}`;
          const guid = 'mapped-12345';
          const appGuid = 'app-12345';
          const routeGuid = 'route-12345';
          const keyName = `${name}-key`;
          const planName = 'basic-vpc';
          const planGuid = 'plan-guid';
          const bucketGuid = 'bucket-guid';
          const accessKeyId = crypto.randomBytes(10).toString('hex');
          const secretAccessKey = crypto.randomBytes(10).toString('hex');
          const region = 'us-gov-other-1';
          const bucket = 'testing-bucket';

          const instanceRequestBody = { name, service_plan_guid: planGuid };
          const keyRequestBody = { name, service_instance_guid: bucketGuid };

          const planResponses = {
            resources: [
              factory.responses.service({ guid: planGuid }, { name: planName }),
            ],
          };
          const bucketResponse = factory.responses.service({ guid: bucketGuid }, { name });
          const keyResponse = factory.responses.service({}, {
            name: keyName,
            service_instance_guid: bucketGuid,
            credentials: factory.responses.credentials({
              access_key_id: accessKeyId,
              secret_access_key: secretAccessKey,
              region,
              bucket,
            }),
          });

          const buildResponses = {
            resources: [
              factory.responses.service({}, {
                name,
                service_instance_guid: bucketGuid,
                credentials: factory.responses.credentials({
                  access_key_id: accessKeyId,
                  secret_access_key: secretAccessKey,
                  region,
                  bucket,
                }),
              }),
            ],
          };

          const serviceCredentialsResponses = {
            resources: [keyResponse],
          };

          const routeResponse = factory.responses.service({ guid: routeGuid });
          const mapResponse = factory.responses.service({ guid }, {
            app_guid: appGuid,
            route_guid: routeGuid,
          });

          mockTokenRequest();
          apiNocks.mockFetchS3ServicePlanGUID(planResponses);
          apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
          apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
          apiNocks.mockFetchServiceInstancesRequest(buildResponses);
          apiNocks.mockFetchServiceInstanceCredentialsRequest('test-guid', serviceCredentialsResponses);
          apiNocks.mockCreateRoute(routeResponse, {
            domain_guid: config.env.cfDomainGuid,
            space_guid: config.env.cfSpaceGuid,
            host: bucket,
          });
          apiNocks.mockMapRoute(mapResponse);

          factory.user().then((model) => {
            user = model;
            githubAPINocks.repo();

            githubAPINocks.userOrganizations({
              accessToken: user.githubAccessToken,
              organizations: [{ login: siteParams.owner }],
            });

            webhookNock = setupWebhook(
              user.githubAccessToken,
              siteParams.owner,
              siteParams.repository
            );

            return SiteCreator.createSite({ user, siteParams });
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
                region
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