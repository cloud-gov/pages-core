const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const request = require('supertest');
const sinon = require('sinon');

const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const githubAPINocks = require('../support/githubAPINocks');
const mockTokenRequest = require('../support/cfAuthNock');
const apiNocks = require('../support/cfAPINocks');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');
const { createSiteUserOrg } = require('../support/site-user');

const { Organization, Role, Site } = require('../../../api/models');
const SiteDestroyer = require('../../../api/services/SiteDestroyer');
const QueueJobs = require('../../../api/queue-jobs');
const EventCreator = require('../../../api/services/EventCreator');

const authErrorMessage =
  'You are not permitted to perform this action. Are you sure you are logged in?';

describe('Site API', () => {
  beforeEach(() => {
    sinon.stub(QueueJobs.prototype, 'startSiteBuild').resolves();
    sinon.stub(EventCreator, 'error').resolves();

    return factory.organization.truncate();
  });

  afterEach(() => {
    sinon.restore();

    return factory.organization.truncate();
  });

  const siteResponseExpectations = (response, site) => {
    expect(response.owner).to.equal(site.owner);
    expect(response.repository).to.equal(site.repository);
    expect(response.engine).to.equal(site.engine);
    expect(response.defaultBranch).to.equal(site.defaultBranch);
  };

  describe('GET /v0/site', () => {
    it('should require authentication', (done) => {
      factory
        .build()
        .then(() => request(app).get('/v0/site').expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should return a list of sites associated with the user', async () => {
      const user = await factory.user();
      const org = await factory.organization.create();
      await org.addRoleUser(user);

      const sites = await Promise.all(
        Array(3)
          .fill(0)
          .map(async () => {
            const { site } = await createSiteUserOrg({ user });
            return site;
          }),
      );
      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get('/v0/site')
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site', 200, response.body);

      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(3);

      sites.forEach((site) => {
        const responseSite = response.body.find((candidate) => candidate.id === site.id);
        expect(responseSite).not.to.be.undefined;
        siteResponseExpectations(responseSite, site);
        expect(responseSite).to.include.keys('canEditLiveUrl', 'canEditDemoUrl');
      });
    });

    it('should not render any sites not associated with the user', (done) => {
      const sitePromises = Array(3)
        .fill(0)
        .map(() => factory.site());

      Promise.all(sitePromises)
        .then((site) => {
          expect(site).to.have.length(3);
          return authenticatedSession(factory.user());
        })
        .then((cookie) => request(app).get('/v0/site').set('Cookie', cookie).expect(200))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site', 200, response.body);
          expect(response.body).to.be.a('array');
          expect(response.body).to.be.empty;
          done();
        })
        .catch(done);
    });
  });

  describe('GET /v0/site/:id', () => {
    it('should require authentication', (done) => {
      factory
        .site()
        .then((site) => request(app).get(`/v0/site/${site.id}`).expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should render a JSON representation of the site', async () => {
      const { site, user } = await createSiteUserOrg();
      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}`)
        .set('Cookie', cookie)
        .expect(200);
      validateAgainstJSONSchema('GET', '/site/{id}', 200, response.body);
      siteResponseExpectations(response.body, site);
    });

    it(`should respond with a 404 if the user
        is not associated with the site`, (done) => {
      let site;

      factory
        .site()
        .then((model) => {
          site = model;
          return authenticatedSession(factory.user());
        })
        .then((cookie) =>
          request(app).get(`/v0/site/${site.id}`).set('Cookie', cookie).expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{id}', 404, response.body);
          done();
        })
        .catch(done);
    });
  });

  describe('POST /v0/site', () => {
    function createMockVariables(owner, repository) {
      return {
        name: `o-${owner}-r-${repository}`,
        bucketGuid: 'bucket-guid',
        s3: {
          accessKeyId: crypto.randomBytes(3).toString('hex'),
          secretAccessKey: crypto.randomBytes(3).toString('hex'),
          region: 'us-gov-other-1',
          bucket: 'testing-bucket',
        },
      };
    }

    function cfMockServices(owner, repository) {
      const { bucketGuid, name, s3 } = createMockVariables(owner, repository);

      const keyName = `${name}-key`;
      const planName = 'basic-vpc';
      const planGuid = 'plan-guid';
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
        access_key_id: s3.accessKeyId,
        secret_access_key: s3.secretAccessKey,
        region: s3.region,
        bucket: s3.bucket,
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
    }

    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.repo();
      githubAPINocks.createRepoForOrg();
      githubAPINocks.webhook();
    });

    afterEach(() => {
      nock.cleanAll();
      sinon.restore();
    });

    it('should require a valid csrf token', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', 'bad-token')
            .send({
              owner: 'partner-org',
              repository: 'partner-site',
              defaultBranch: 'main',
              engine: 'jekyll',
            })
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 403, response.body);
          expect(response.body.message).to.equal('Invalid CSRF token');
          done();
        })
        .catch(done);
    });

    it('should require authentication', (done) => {
      unauthenticatedSession()
        .then((cookie) => {
          const newSiteRequest = request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: 'partner-org',
              repository: 'partner-site',
              defaultBranch: 'main',
              engine: 'jekyll',
            })
            .set('Cookie', cookie)
            .expect(403);

          return newSiteRequest;
        })
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should create a new site from an existing repository', async () => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');

      cfMockServices(siteOwner, siteRepository);
      const user = await factory.user();
      githubAPINocks.userOrganizations({
        accessToken: user.githubAccessToken,
        organizations: [
          {
            login: siteOwner,
          },
        ],
      });

      const cookie = await authenticatedSession(user);
      const response = request(app)
        .post('/v0/site')
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          owner: siteOwner,
          repository: siteRepository,
          defaultBranch: 'main',
          engine: 'jekyll',
        })
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('POST', '/site', 200, response.body);
      const site = await Site.findOne({
        where: {
          owner: siteOwner,
          repository: siteRepository,
        },
      });

      expect(site).to.not.be.undefined;
    });

    it(`should create a new site from an existing repository
        and associate it to an org`, async () => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');
      const org = await factory.organization.create();
      const role = await Role.findOne({
        where: {
          name: 'user',
        },
      });

      cfMockServices(siteOwner, siteRepository);

      return factory
        .user()
        .then((user) =>
          org
            .addUser(user, {
              through: {
                roleId: role.id,
              },
            })
            .then(() => user),
        )
        .then((user) => {
          githubAPINocks.userOrganizations({
            accessToken: user.githubAccessToken,
            organizations: [
              {
                login: siteOwner,
              },
            ],
          });

          return authenticatedSession(user);
        })
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: siteOwner,
              repository: siteRepository,
              defaultBranch: 'main',
              engine: 'jekyll',
              organizationId: org.id,
            })
            .set('Cookie', cookie)
            .expect(200),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 200, response.body);
          return Site.findOne({
            where: {
              owner: siteOwner,
              repository: siteRepository,
            },
            include: [Organization],
          });
        })
        .then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.Organization.id).to.equal(org.id);
        });
    });

    it('should create a new repo and site from a template', (done) => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');

      nock.cleanAll();
      githubAPINocks.repo();
      githubAPINocks.webhook();

      cfMockServices(siteOwner, siteRepository);

      const createRepoNock = githubAPINocks.createRepoUsingTemplate({
        org: siteOwner,
        repo: siteRepository,
      });

      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: siteOwner,
              repository: siteRepository,
              defaultBranch: 'main',
              engine: 'node.js',
              template: 'uswds-11ty',
            })
            .set('Cookie', cookie)
            .expect(200),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 200, response.body);
          return Site.findOne({
            where: {
              owner: siteOwner,
              repository: siteRepository,
            },
          });
        })
        .then((site) => {
          expect(site).to.not.be.undefined;
          expect(createRepoNock.isDone()).to.equal(true);
          done();
        })
        .catch(done);
    });

    it(`should create a new repo
        and site from a template and associate it to an org`, async () => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');
      const user = await factory.user();
      const org = await factory.organization.create();
      const role = await Role.findOne({
        where: {
          name: 'user',
        },
      });
      await org.addUser(user, {
        through: {
          roleId: role.id,
        },
      });

      cfMockServices(siteOwner, siteRepository);

      nock.cleanAll();
      githubAPINocks.repo();
      githubAPINocks.webhook();

      cfMockServices(siteOwner, siteRepository);

      const createRepoNock = githubAPINocks.createRepoUsingTemplate({
        org: siteOwner,
        repo: siteRepository,
      });

      return authenticatedSession(user)
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: siteOwner,
              repository: siteRepository,
              defaultBranch: 'main',
              engine: 'node.js',
              organizationId: org.id,
              template: 'uswds-11ty',
            })
            .set('Cookie', cookie)
            .expect(200),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 200, response.body);
          return Site.findOne({
            where: {
              owner: siteOwner,
              repository: siteRepository,
            },
            include: [Organization],
          });
        })
        .then((site) => {
          expect(site).to.not.be.undefined;
          expect(site.Organization.id).to.equal(org.id);
          expect(createRepoNock.isDone()).to.equal(true);
        });
    });

    it('should respond with a 403 if no user or repository is specified', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              defaultBranch: 'main',
              engine: 'node.js',
              template: 'uswds-gatsby',
            })
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if template specified does not exist', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: 'siteOwner',
              repository: 'siteRepository',
              defaultBranch: 'main',
              engine: 'jekyll',
              template: 'fake-template',
            })
            .set('Cookie', cookie)
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 400, response.body);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if the site already exists', (done) => {
      const userPromise = factory.user();

      Promise.props({
        user: factory.user(),
        site: factory.site(),
        cookie: authenticatedSession(userPromise),
      })
        .then(({ site, cookie }) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: site.owner,
              repository: site.repository,
              defaultBranch: 'main',
              engine: 'jekyll',
            })
            .set('Cookie', cookie)
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 400, response.body);
          expect(response.body.message).to.equal(
            `This site has already been added to ${config.app.appName}.`,
          );
          done();
        })
        .catch(done);
    });

    it(`should respond with a 400 if the user
        does not have admin access to the repository`, (done) => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');

      nock.cleanAll();
      githubAPINocks.repo({
        owner: siteOwner,
        repository: siteRepository,
        response: [
          200,
          {
            permissions: {
              admin: false,
              push: false,
            },
          },
        ],
      });
      githubAPINocks.webhook();

      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: siteOwner,
              repository: siteRepository,
              defaultBranch: 'main',
              engine: 'jekyll',
            })
            .set('Cookie', cookie)
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 400, response.body);
          expect(response.body.message).to.equal(
            'You do not have admin access to this repository',
          );
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if a webhook cannot be created', (done) => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');

      nock.cleanAll();
      githubAPINocks.repo();
      githubAPINocks.webhook({
        owner: siteOwner,
        repo: siteRepository,
        response: [
          404,
          {
            message: 'Not Found',
          },
        ],
      });

      cfMockServices(siteOwner, siteRepository);

      factory
        .user()
        .then((user) => {
          githubAPINocks.userOrganizations({
            accessToken: user.githubAccessToken,
            organizations: [
              {
                login: siteOwner,
              },
            ],
          });

          return authenticatedSession(user);
        })
        .then((cookie) =>
          request(app)
            .post('/v0/site')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: siteOwner,
              repository: siteRepository,
              defaultBranch: 'main',
              engine: 'jekyll',
            })
            .set('Cookie', cookie)
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site', 400, response.body);
          expect(response.body.message).to.equal(
            'You do not have admin access to this repository',
          );
          done();
        })
        .catch(done);
    });
  });

  describe('DELETE /v0/site/:id', () => {
    let queueDestroySiteInfra;

    beforeEach(() => {
      queueDestroySiteInfra = sinon
        .stub(SiteDestroyer, 'queueDestroySiteInfra')
        .resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should require authentication', (done) => {
      let site;

      factory
        .site()
        .then((model) => {
          site = model;
          nock.cleanAll();
          githubAPINocks.repo({
            owner: site.owner,
            repository: site.repo,
            response: [
              200,
              {
                permissions: {
                  admin: true,
                  push: true,
                },
              },
            ],
          });
          return unauthenticatedSession();
        })
        .then((cookie) =>
          request(app)
            .delete(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('DELETE', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should require a valid csrf token', (done) => {
      let site;

      factory
        .site()
        .then((model) => {
          site = model;
          return authenticatedSession();
        })
        .then((cookie) =>
          request(app)
            .delete(`/v0/site/${site.id}`)
            .set('x-csrf-token', 'bad-token')
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal('Invalid CSRF token');
          done();
        })
        .catch(done);
    });

    it('should allow a user to delete a site associated with their account', async () => {
      const { site, user } = await createSiteUserOrg();
      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [
          200,
          {
            permissions: {
              admin: true,
              push: true,
            },
          },
        ],
      });
      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .delete(`/v0/site/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).to.deep.eq({});
      const sites = await Site.findAll({
        where: {
          id: site.id,
        },
      });
      expect(sites).to.be.empty;
    });

    it('does not destroy the site when the site has a domain', async () => {
      nock.cleanAll();

      const { site, user } = await createSiteUserOrg();
      const domain = await factory.domain.create({ siteId: site.id });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [
          200,
          {
            permissions: {
              admin: true,
              push: true,
            },
          },
        ],
      });

      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .delete(`/v0/site/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .set('Cookie', cookie)
        .expect(422);

      await site.reload({
        paranoid: false,
      });
      expect(site.isSoftDeleted()).to.be.false;
      expect(response.body.message).to.have.string(domain.names);
    });

    it(`should not allow a user to delete a site
        not associated with their account`, (done) => {
      let site;

      factory
        .site()
        .then((s) => Site.findByPk(s.id))
        .then((model) => {
          site = model;
          return authenticatedSession(factory.user());
        })
        .then((cookie) =>
          request(app)
            .delete(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('DELETE', '/site/{id}', 404, response.body);
          return Site.findAll({
            where: {
              id: site.id,
            },
          });
        })
        .then((sites) => {
          expect(sites).not.to.be.empty;
          done();
        })
        .catch(done);
    });

    it("should plan to remove all of the site's data from S3", async () => {
      const { site, user } = await createSiteUserOrg();
      const cookie = await authenticatedSession(user);

      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [
          200,
          {
            permissions: {
              admin: true,
              push: true,
            },
          },
        ],
      });

      await request(app)
        .delete(`/v0/site/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .set('Cookie', cookie)
        .expect(200);

      sinon.assert.calledOnce(queueDestroySiteInfra);
      expect(queueDestroySiteInfra.firstCall.args[0].id).to.eq(site.id);
    });

    it(`should not allow a user to delete a site
        associated with their account if not admin`, async () => {
      const { site, user } = await createSiteUserOrg();

      nock.cleanAll();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
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

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .delete(`/v0/site/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .set('Cookie', cookie)
        .expect(403);

      validateAgainstJSONSchema('DELETE', '/site/{id}', 403, response.body);
      expect(response.body.message).to.equal(
        'You do not have administrative access to this repository',
      );
      const sites = await Site.findAll({
        where: {
          id: site.id,
        },
      });

      expect(sites).to.not.be.empty;
    });
  });

  describe('PUT /v0/site/:id', () => {
    it('should require authentication', (done) => {
      let site;

      factory
        .site()
        .then((model) => {
          site = model;
          return unauthenticatedSession();
        })
        .then((cookie) =>
          request(app)
            .put(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              defaultBranch: 'main',
            })
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should require a valid csrf token', (done) => {
      let site;

      factory
        .site()
        .then((model) => {
          site = model;
          return authenticatedSession();
        })
        .then((cookie) =>
          request(app)
            .put(`/v0/site/${site.id}`)
            .set('x-csrf-token', 'bad-token')
            .send({
              defaultBranch: 'main',
            })
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
          expect(response.body.message).to.equal('Invalid CSRF token');
          done();
        })
        .catch(done);
    });

    it(`should not allow a user to update a site
        not associated with their account`, (done) => {
      let siteModel;
      factory
        .site({
          repository: 'old-repo-name',
        })
        .then((site) => Site.findByPk(site.id))
        .then((model) => {
          siteModel = model;
          return authenticatedSession(factory.user());
        })
        .then((cookie) =>
          request(app)
            .put(`/v0/site/${siteModel.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              repository: 'new-repo-name',
            })
            .set('Cookie', cookie)
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('PUT', '/site/{id}', 404, response.body);
          return Site.findByPk(siteModel.id);
        })
        .then((site) => {
          expect(site).to.have.property('repository', 'old-repo-name');
          done();
        })
        .catch(done);
    });

    it('should update engine params', async () => {
      const { site, user } = await createSiteUserOrg();
      await site.update({ engine: 'jekyll' });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .put(`/v0/site/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          engine: 'hugo',
        })
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
      const foundSite = await Site.findByPk(site.id);

      expect(foundSite).to.have.property('engine', 'hugo');
    });

    it('should ignore non-engine params', async () => {
      const { site, user } = await createSiteUserOrg();
      await site.update({ repository: 'original' });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .put(`/v0/site/${site.id}`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          repository: 'updated',
        })
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
      const foundSite = await Site.findByPk(site.id);

      expect(foundSite).to.have.property('repository', 'original');
    });
  });

  describe('GET /v0/site/:site_id/domains', () => {
    it('should require authentication', async () => {
      const siteId = 1;
      const response = await request(app).get(`/v0/site/${siteId}/domains`).expect(403);

      validateAgainstJSONSchema('GET', '/site/{site_id}/domains', 403, response.body);
      expect(response.body.message).to.equal(authErrorMessage);
    });

    it('should return 404 not found with a site that does not exist', async () => {
      const siteId = 8675309;
      const user = await factory.user();

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${siteId}/domains`)
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema('GET', '/site/{site_id}/domains', 404, response.body);
    });

    it('should render a list of domains associated with a site', async () => {
      const site = await factory.site({
        demoBranch: 'demo',
      });
      const { user } = await createSiteUserOrg({ site });

      const domain1 = await factory.domain.create({
        siteId: site.id,
        context: 'site',
      });
      const domain2 = await factory.domain.create({
        siteId: site.id,
        context: 'demo',
      });
      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/domains`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site/{site_id}/domains', 200, response.body);
      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(2);
      response.body.map((record) => {
        const foundDomains = [domain1, domain2].find((domain) => record.id === domain.id);
        expect(foundDomains).not.to.be.undefined;
      });
    });

    it(`should return an empty list
          when no domains are associated with a site`, async () => {
      const { site, user } = await createSiteUserOrg();
      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/domains`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site/{site_id}/domains', 200, response.body);
      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(0);
    });
  });

  describe('GET /v0/site/:site_id/tasks', () => {
    it('should return tasks for a site', async () => {
      const { user, site } = await createSiteUserOrg();
      const build = await factory.build({ site });
      const buildTaskType = await factory.buildTaskType();
      const buildTask = await factory.buildTask({
        buildTaskType,
        build,
      });

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/tasks`)
        .set('Cookie', cookie)
        .expect(200);

      // TODO: update this validation for artifact (model is string, response is obj)
      // validateAgainstJSONSchema(
      //   'GET',
      //   '/site/{site_id}/tasks',
      //   200,
      //   response.body
      // );

      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(1);
      expect(response.body[0]).to.have.property('id', buildTask.id);
    });
  });
});
