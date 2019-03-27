const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const { stub } = require('sinon');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const SiteCreator = require('../../../../api/services/SiteCreator');
const TemplateResolver = require('../../../../api/services/TemplateResolver');
const { Build, Site, User } = require('../../../../api/models');

describe('SiteCreator', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  describe('.createSite', () => {
    const validateSiteExpectations = (
      site,
      owner,
      repository,
      user,
      cfInstanceName = 'federalist-dev-s3',
      awsBucketName = 's3-bucket',
      awsBucketRegion = 'us-gov-west-1'
    ) => {
      expect(site).to.not.be.undefined;
      expect(site.owner).to.equal(owner);
      expect(site.repository).to.equal(repository);
      expect(site.cfInstanceName).to.equal(cfInstanceName);
      expect(site.awsBucketName).to.equal(awsBucketName);
      expect(site.awsBucketRegion).to.equal(awsBucketRegion);
      expect(site.Users).to.have.length(1);
      expect(site.Users[0].id).to.equal(user.id);
      expect(site.Builds).to.have.length(1);
      expect(site.Builds[0].user).to.equal(user.id);
    };

    const afterCreateSite = (owner, repository) => Site.findOne({
      where: {
        owner,
        repository,
      },
      include: [User, Build],
    });

    context('from a GitHub repo', () => {
      let user;
      let webhookNock;

      const setupWebhook = (accessToken, owner, repo) => githubAPINocks.webhook({
        accessToken,
        owner,
        repo,
      });

      context('when the owner of the repo is an authorized federalist org', () => {
        it('creates new site record for the given repository, adds the user, webhook, and build', (done) => {
          const siteParams = {
            owner: crypto.randomBytes(3).toString('hex'),
            repository: crypto.randomBytes(3).toString('hex'),
          };

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
                user
              );
              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });

        it('ignores case when comparing org name', (done) => {
          const siteParams = {
            owner: crypto.randomBytes(3).toString('hex'),
            repository: crypto.randomBytes(3).toString('hex'),
          };

          factory.user().then((model) => {
            user = model;
            githubAPINocks.repo();
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
                user
              );
              done();
            })
            .catch(done);
        });
      });

      context('when the user that owns the repo is a federalist user', () => {
        it('creates new site record for the given repository, adds the user, webhook, and build', (done) => {
          const siteParams = {
            repository: crypto.randomBytes(3).toString('hex'),
          };

          factory.user().then((model) => {
            user = model;
            siteParams.owner = user.username;

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
                user
              );

              expect(webhookNock.isDone()).to.equal(true);
              done();
            })
            .catch(done);
        });
      });

      it('should reject if the user does not have admin access to the site', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
        };

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
            expect(err.message).to.equal('This site has already been added to Federalist.');
            done();
          }).catch(done);
      });

      it('should reject if the GitHub repository does not exist', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
        };

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
          expect(err.code).to.eq(404);
          expect(err.status).to.eq('Not Found');
          done();
        }).catch(done);
      });

      it('rejects if the org that owns the repo has not authorized federalist', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
        };

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
            const expectedError = `Federalist can't confirm org permissions for '${siteParams.owner}'.`
            + `Either '${siteParams.owner}' hasn't approved access for Federalist or you aren't an org member.`
            + 'Ensure you are an org member and ask an org owner to authorize Federalist for the organization.';

            expect(err.message).to.equal(expectedError);
            expect(err.status).to.equal(403);
            done();
          });
      });
    });

    context('when the site is created from a template', () => {
      const siteParams = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        template: 'uswds',
      };
      let user;

      it('should create a new site record for the given repository and add the user', (done) => {
        factory.user().then((model) => {
          user = model;
          githubAPINocks.createRepoForOrg();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ user, siteParams });
        }).then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.owner).to.equal(siteParams.owner);
          expect(site.repository).to.equal(siteParams.repository);
          expect(site.defaultBranch).to.equal('master');

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
            githubAPINocks.createRepoForOrg();
            githubAPINocks.webhook();
            return SiteCreator.createSite({ siteParams, user });
          }).then((site) => {
            expect(site.engine).to.equal('jekyll');
            done();
          }).catch(done);
      });

      it('should trigger a build that pushes the source repo to the destiantion repo', (done) => {
        const templateResolverStub = stub(TemplateResolver, 'getTemplate');
        const fakeTemplate = {
          repo: 'federalist-template',
          owner: '18f',
          branch: 'not-master',
        };

        templateResolverStub.returns(fakeTemplate);

        factory.user().then((model) => {
          user = model;
          githubAPINocks.createRepoForOrg();
          githubAPINocks.webhook();
          return SiteCreator.createSite({ siteParams, user });
        }).then(site => Site.findByPk(site.id, { include: [Build] })).then((site) => {
          expect(site.Builds).to.have.length(1);
          expect(site.Builds[0].user).to.equal(user.id);
          expect(site.Builds[0].branch).to.equal(site.defaultBranch);
          expect(site.Builds[0].source.repository).to.equal(fakeTemplate.repo);
          expect(site.Builds[0].source.owner).to.equal(fakeTemplate.owner);

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
            githubAPINocks.createRepoForOrg();
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

            githubAPINocks.createRepoForOrg({
              accessToken: user.accessToken,
              org: siteParams.owner,
              repo: siteParams.repository,
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
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
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

    context('creating a site from an existing site', () => {
      it('creates a repo and webhook, new site on federalist for specified user', (done) => {
        let user;
        let site;
        let siteParams;
        let webhookNock;

        factory.user()
          .then((userModel) => {
            user = userModel;

            return factory.site({ owner: user.username });
          })
          .then((siteModel) => {
            site = siteModel;

            return { site, user };
          })
          .then((values) => {
            siteParams = {
              owner: crypto.randomBytes(3).toString('hex'),
              repository: crypto.randomBytes(3).toString('hex'),
              defaultBranch: 'master',
              source: {
                owner: values.site.owner,
                repo: values.site.repository,
              },
            };

            githubAPINocks.repo();
            githubAPINocks.createRepoForOrg();
            webhookNock = githubAPINocks.webhook();

            return SiteCreator.createSite({ user: values.user, siteParams })
              .then(() => afterCreateSite(siteParams.owner, siteParams.repository))
              .then((model) => {
                site = model;

                validateSiteExpectations(
                  site,
                  siteParams.owner,
                  siteParams.repository,
                  user
                );

                expect(webhookNock.isDone()).to.equal(true);
                done();
              })
              .catch(done);
          });
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

      it('creates new bucket and site record for the given repository, adds the user, webhook, and build', (done) => {
        const siteParams = {
          owner: crypto.randomBytes(3).toString('hex'),
          repository: crypto.randomBytes(3).toString('hex'),
          sharedBucket: false,
        };
        const name = siteParams.repository;
        const keyName = `${name}-key`;
        const planName = 'basic-public';
        const planGuid = 'plan-guid';
        const bucketGuid = 'bucket-guid';
        const accessKeyId = crypto.randomBytes(3).toString('hex');
        const secretAccessKey = crypto.randomBytes(3).toString('hex');
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

        mockTokenRequest();
        apiNocks.mockFetchS3ServicePlanGUID(planResponses);
        apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
        apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);
        apiNocks.mockFetchServiceInstancesRequest(buildResponses);
        apiNocks.mockFetchServiceInstanceCredentialsRequest('test-guid', serviceCredentialsResponses);

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
