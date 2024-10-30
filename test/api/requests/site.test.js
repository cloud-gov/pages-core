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

const { Build, Organization, Role, Site, User } = require('../../../api/models');
const SiteDestroyer = require('../../../api/services/SiteDestroyer');
const siteErrors = require('../../../api/responses/siteErrors');
const QueueJobs = require('../../../api/queue-jobs');
const EventCreator = require('../../../api/services/EventCreator');
const DomainService = require('../../../api/services/Domain');

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

    it('should render a list of sites associated with the user', (done) => {
      let user;
      let sites;
      let response;

      factory
        .user()
        .then((model) => {
          user = model;
          const sitePromises = Array(3)
            .fill(0)
            .map(() =>
              factory.site({
                users: [user.id],
              }),
            );
          return Promise.all(sitePromises);
        })
        .then((models) => {
          sites = models;
          return authenticatedSession(user);
        })
        .then((cookie) => request(app).get('/v0/site').set('Cookie', cookie).expect(200))
        .then((resp) => {
          response = resp;

          validateAgainstJSONSchema('GET', '/site', 200, response.body);

          expect(response.body).to.be.a('array');
          expect(response.body).to.have.length(3);

          return Promise.all(
            sites.map((site) =>
              Site.findByPk(site.id, {
                include: [User],
              }),
            ),
          );
        })
        .then((foundSites) => {
          foundSites.forEach((site) => {
            const responseSite = response.body.find(
              (candidate) => candidate.id === site.id,
            );
            expect(responseSite).not.to.be.undefined;
            siteResponseExpectations(responseSite, site);
          });
          done();
        })
        .catch(done);
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

    it("should include sites' URL editability", (done) => {
      let user;
      let sites;
      let response;

      factory
        .user()
        .then((model) => {
          user = model;
          const sitePromises = Array(3)
            .fill(0)
            .map(() =>
              factory.site({
                users: [user.id],
              }),
            );

          return Promise.all(sitePromises);
        })
        .then((models) => {
          sites = models;
          return authenticatedSession(user);
        })
        .then((cookie) => request(app).get('/v0/site').set('Cookie', cookie).expect(200))
        .then((resp) => {
          response = resp;

          validateAgainstJSONSchema('GET', '/site', 200, response.body);

          expect(response.body).to.be.a('array');
          expect(response.body).to.have.length(3);

          return Promise.all(
            sites.map((site) =>
              Site.findByPk(site.id, {
                include: [User],
              }),
            ),
          );
        })
        .then((foundSites) => {
          foundSites.forEach((site) => {
            const responseSite = response.body.find(
              (candidate) => candidate.id === site.id,
            );
            expect(responseSite).not.to.be.undefined;
            siteResponseExpectations(responseSite, site);
            expect(responseSite).to.include.keys('canEditLiveUrl', 'canEditDemoUrl');
          });
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

    it('should render a JSON representation of the site', (done) => {
      let site;

      factory
        .site()
        .then((s) =>
          Site.findByPk(s.id, {
            include: [User],
          }),
        )
        .then((model) => {
          site = model;
          return authenticatedSession(site.Users[0]);
        })
        .then((cookie) =>
          request(app).get(`/v0/site/${site.id}`).set('Cookie', cookie).expect(200),
        )
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{id}', 200, response.body);
          siteResponseExpectations(response.body, site);
          done();
        })
        .catch(done);
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

    it('should create a new site from an existing repository', (done) => {
      const siteOwner = crypto.randomBytes(3).toString('hex');
      const siteRepository = crypto.randomBytes(3).toString('hex');

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
          done();
        })
        .catch(done);
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

  describe('POST /v0/site/user', () => {
    beforeEach(() => {
      nock.cleanAll();
      githubAPINocks.repo();
    });

    it('should require a valid csrf token', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', 'bad-token')
            .send({
              owner: 'partner-org',
              repository: 'partner-site',
            })
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 403, response.body);
          expect(response.body.message).to.equal('Invalid CSRF token');
          done();
        })
        .catch(done);
    });

    it('should require authentication', (done) => {
      unauthenticatedSession()
        .then((cookie) => {
          const newSiteRequest = request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              owner: 'partner-org',
              repository: 'partner-site',
            })
            .set('Cookie', cookie)
            .expect(403);

          return newSiteRequest;
        })
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should add the user to the site', (done) => {
      const userPromise = factory.user();
      let user;
      let site;

      Promise.props({
        user: userPromise,
        site: factory.site(),
        cookie: authenticatedSession(userPromise),
      })
        .then((models) => {
          ({ user, site } = models);

          return request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', models.cookie)
            .send({
              owner: site.owner,
              repository: site.repository,
            })
            .expect(200);
        })
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 200, response.body);
          return Site.findByPk(site.id, {
            include: [User],
          });
        })
        .then((fetchedSite) => {
          expect(fetchedSite.Users).to.be.an('array');
          const userIDs = fetchedSite.Users.map((u) => u.id);
          expect(userIDs).to.include(user.id);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if no user or repository is specified', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .send({})
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 400, response.body);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if the user has already added the site', (done) => {
      const userPromise = factory.user();

      Promise.props({
        site: factory.site({
          users: Promise.all([userPromise]),
        }),
        cookie: authenticatedSession(userPromise),
      })
        .then(({ site, cookie }) =>
          request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .send({
              owner: site.owner,
              repository: site.repository,
            })
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 400, response.body);
          expect(response.body.message).to.eq(
            `You've already added this site to ${config.app.appName}`,
          );
          done();
        })
        .catch(done);
    });

    it(`should respond with a 400 if the user
        does not have write access to repository`, (done) => {
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

      Promise.props({
        cookie: authenticatedSession(),
        site: factory.site({
          owner: siteOwner,
          repository: siteRepository,
        }),
      })
        .then(({ cookie, site }) =>
          request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .send({
              owner: site.owner,
              repository: site.repository,
            })
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 400, response.body);
          expect(response.body.message).to.eq(
            'You do not have write access to this repository',
          );
          done();
        })
        .catch(done);
    });

    it('should respond with a 404 if the site does not exist', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .post('/v0/site/user')
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .send({
              owner: 'this-is',
              repository: 'not-real',
            })
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('POST', '/site/user', 404, response.body);
          expect(response.body.message).to.eq(
            'The site you are trying to add does not exist',
          );
          done();
        })
        .catch(done);
    });
  });

  describe('DELETE /v0/site/:site_id/user/:user_id', () => {
    const path = '/site/{site_id}/user/{user_id}';
    const requestPath = (siteId, userId) => `/v0/site/${siteId}/user/${userId}`;

    it('should require a valid csrf token', (done) => {
      authenticatedSession()
        .then((cookie) =>
          request(app)
            .delete(requestPath(1, 1))
            .set('x-csrf-token', 'bad-token')
            .set('Cookie', cookie)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 403, response.body);
          expect(response.body.message).to.equal('Invalid CSRF token');
          done();
        })
        .catch(done);
    });

    it('should require authentication', (done) => {
      unauthenticatedSession()
        .then((cookie) => {
          const newSiteRequest = request(app)
            .delete(requestPath(1, 1))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(403);
          return newSiteRequest;
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 403, response.body);
          expect(response.body.message).to.equal(authErrorMessage);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if siteId or userId are not numbers', (done) => {
      const userPromise = factory.user();

      Promise.props({
        user: userPromise,
        site: factory.site(),
        cookie: authenticatedSession(userPromise),
      })
        .then((models) =>
          request(app)
            .delete(requestPath('a-site', 'a-user'))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', models.cookie)
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 400, response.body);
          expect(response.body.message).to.equal('Bad Request');
          done();
        })
        .catch(done);
    });

    it('should return a 404 if the site cannot be found', (done) => {
      const userPromise = factory.user();

      Promise.props({
        user: userPromise,
        site: factory.site(),
        cookie: authenticatedSession(userPromise),
      })
        .then((models) =>
          request(app)
            .delete(requestPath(1000, models.user.id))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', models.cookie)
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 404, response.body);
          expect(response.body.message).to.equal('Not found');
          done();
        })
        .catch(done);
    });

    it('should remove the user from the site', (done) => {
      const mike = factory.user({
        username: 'mike',
      });
      const jane = factory.user({
        username: 'jane',
      });
      let currentSite;

      Promise.props({
        user: jane,
        site: factory.site({
          users: Promise.all([mike, jane]),
        }),
        cookie: authenticatedSession(jane),
      })
        .then(({ user, site, cookie }) => {
          currentSite = site;

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

          return request(app)
            .delete(requestPath(site.id, user.id))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(200);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 200, response.body);
          return Site.withUsers(currentSite.id);
        })
        .then((fetchedSite) => {
          expect(fetchedSite.Users).to.be.an('array');
          expect(fetchedSite.Users.length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should allow the owner to remove a user from the site', (done) => {
      const username = 'b-user';
      const userPromise = factory.user({
        username,
      });
      const anotherUser = factory.user();
      const siteProps = {
        owner: username,
        users: Promise.all([userPromise, anotherUser]),
      };

      let currentSite;

      nock.cleanAll();

      Promise.props({
        user: userPromise,
        site: factory.site(siteProps),
        cookie: authenticatedSession(userPromise),
        anotherUser,
      })
        .then((models) => {
          currentSite = models.site;

          githubAPINocks.repo({
            owner: username,
            repository: models.site.repo,
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

          return request(app)
            .delete(requestPath(models.site.id, models.anotherUser.id))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', models.cookie)
            .expect(200);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 200, response.body);
          return Site.withUsers(currentSite.id);
        })
        .then((fetchedSite) => {
          expect(fetchedSite.Users).to.be.an('array');
          expect(fetchedSite.Users.length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 when deleting the final user', (done) => {
      const userPromise = factory.user();

      Promise.props({
        user: userPromise,
        site: factory.site({
          users: Promise.all([userPromise]),
        }),
        cookie: authenticatedSession(userPromise),
      })
        .then(({ user, site, cookie }) =>
          request(app)
            .delete(requestPath(site.id, user.id))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(400),
        )
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 400, response.body);
          expect(response.body.message).to.equal(siteErrors.USER_REQUIRED);
          done();
        })
        .catch(done);
    });

    it('should respond with a 404 when the user to delete is not found', (done) => {
      const userPromise = factory.user();
      const otherUser = factory.user();

      nock.cleanAll();

      Promise.props({
        site: factory.site({
          users: Promise.all([userPromise, otherUser]),
        }),
        cookie: authenticatedSession(userPromise),
      })
        .then((models) => {
          githubAPINocks.repo({
            owner: 'james',
            repository: models.site.repo,
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

          return request(app)
            .delete(requestPath(models.site.id, 100000))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', models.cookie)
            .expect(404);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 404, response.body);
          expect(response.body.message).to.equal(siteErrors.NO_ASSOCIATED_USER);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 when any user attempts to remove the owner', (done) => {
      const ownerName = 'owner';
      const ownerUser = factory.user({
        username: ownerName,
      });
      const normalUser = factory.user({
        username: 'not-owner',
      });

      const siteProps = {
        owner: ownerName,
        users: Promise.all([ownerUser, normalUser]),
      };

      nock.cleanAll();

      Promise.props({
        user: ownerUser,
        site: factory.site(siteProps),
        cookie: authenticatedSession(normalUser),
      })
        .then(({ user, site, cookie }) => {
          githubAPINocks.repo({
            owner: ownerName,
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

          return request(app)
            .delete(requestPath(site.id, user.id))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(400);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 400, response.body);
          expect(response.body.message).to.equal(siteErrors.OWNER_REMOVE);
          done();
        })
        .catch(done);
    });

    it(`should respond with a 400
        when the site owner attempts to remove themselves`, (done) => {
      const username = 'a-user';
      const userPromise = factory.user({
        username,
      });
      const anotherUser = factory.user();
      const siteProps = {
        owner: username,
        users: Promise.all([userPromise, anotherUser]),
      };

      nock.cleanAll();

      Promise.props({
        user: userPromise,
        site: factory.site(siteProps),
        cookie: authenticatedSession(userPromise),
      })
        .then(({ user, site, cookie }) => {
          githubAPINocks.repo({
            owner: username,
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

          return request(app)
            .delete(`/v0/site/${site.id}/user/${user.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(400);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 400, response.body);
          expect(response.body.message).to.equal(siteErrors.OWNER_REMOVE);
          done();
        })
        .catch(done);
    });

    it('should respond with a 400 if the user does not have admin access', (done) => {
      const username = 'jane';
      const userA = factory.user();
      const userB = factory.user();
      const repo = 'whatever';
      const siteProps = {
        owner: username,
        repository: repo,
        users: Promise.all([userA, userB]),
      };

      nock.cleanAll();

      Promise.props({
        user: userB,
        site: factory.site(siteProps),
        cookie: authenticatedSession(userA),
      })
        .then(({ user, site, cookie }) => {
          githubAPINocks.repo({
            owner: site.username,
            repository: site.repo,
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

          return request(app)
            .delete(`/v0/site/${site.id}/user/${user.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(400);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 400, response.body);
          expect(response.body.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED);
          done();
        })
        .catch(done);
    });

    it(`should allow a user to remove themselves even
        if they are not a repo write user`, (done) => {
      const username = 'jane';
      const userA = factory.user();
      const userB = factory.user();
      const repo = 'whatever';
      const siteProps = {
        owner: username,
        repository: repo,
        users: Promise.all([userA, userB]),
      };
      let currentSite;

      nock.cleanAll();

      Promise.props({
        user: userA,
        site: factory.site(siteProps),
        cookie: authenticatedSession(userA),
      })
        .then(({ user, site, cookie }) => {
          currentSite = site;
          githubAPINocks.repo({
            owner: site.username,
            repository: site.repo,
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

          return request(app)
            .delete(requestPath(site.id, user.id))
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(200);
        })
        .then((response) => {
          validateAgainstJSONSchema('DELETE', path, 200, response.body);
          return Site.withUsers(currentSite.id);
        })
        .then((fetchedSite) => {
          expect(fetchedSite.Users).to.be.an('array');
          expect(fetchedSite.Users.length).to.equal(1);
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

    it('should allow a user to delete a site associated with their account', (done) => {
      let site;

      factory
        .site()
        .then((s) =>
          Site.findByPk(s.id, {
            include: [User],
          }),
        )
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
          return authenticatedSession(site.Users[0]);
        })
        .then((cookie) =>
          request(app)
            .delete(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', cookie)
            .expect(200),
        )
        .then((response) => {
          expect(response.body).to.deep.eq({});
          return Site.findAll({
            where: {
              id: site.id,
            },
          });
        })
        .then((sites) => {
          expect(sites).to.be.empty;
          done();
        })
        .catch(done);
    });

    it('does not destroy the site when the site has a domain', async () => {
      nock.cleanAll();

      const user = await factory.user();
      const site = await factory.site({
        users: [user],
      });
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

    it("should plan to remove all of the site's data from S3", (done) => {
      let site;
      const userPromise = factory.user();
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
      });
      const sessionPromise = authenticatedSession(userPromise);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: sessionPromise,
      })
        .then((results) => {
          ({ site } = results);
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

          return request(app)
            .delete(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .set('Cookie', results.cookie)
            .expect(200);
        })
        .then(() => {
          sinon.assert.calledOnce(queueDestroySiteInfra);
          expect(queueDestroySiteInfra.firstCall.args[0].id).to.eq(site.id);
          done();
        })
        .catch(done);
    });

    it(`should not allow a user to delete a site
        associated with their account if not admin`, (done) => {
      let site;

      factory
        .site()
        .then((s) =>
          Site.findByPk(s.id, {
            include: [User],
          }),
        )
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
                  admin: false,
                  push: true,
                },
              },
            ],
          });

          return authenticatedSession(site.Users[0]);
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
          expect(response.body.message).to.equal(
            'You do not have administrative access to this repository',
          );
          return Site.findAll({
            where: {
              id: site.id,
            },
          });
        })
        .then((sites) => {
          expect(sites).to.not.be.empty;
          done();
        })
        .catch(done);
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

    it('should trigger a rebuild of the site', () => {
      let siteModel;
      factory
        .site({
          repository: 'old-repo-name',
        })
        .then((site) =>
          Site.findByPk(site.id, {
            include: [User, Build],
          }),
        )
        .then((model) => {
          siteModel = model;
          expect(siteModel.Builds).to.have.length(0);
          return authenticatedSession(siteModel.Users[0]);
        })
        .then((cookie) =>
          request(app)
            .put(`/v0/site/${siteModel.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              repository: 'new-repo-name',
            })
            .set('Cookie', cookie)
            .expect(200),
        );
    });

    it('should trigger a rebuild of the demo branch if one is present', () => {
      let siteModel;
      factory
        .site({
          repository: 'old-repo-name',
          demoBranch: 'demo',
          demoDomain: 'https://demo.example.gov',
        })
        .then((site) =>
          Site.findByPk(site.id, {
            include: [User, Build],
          }),
        )
        .then((model) => {
          siteModel = model;
          expect(siteModel.Builds).to.have.length(0);
          return authenticatedSession(siteModel.Users[0]);
        })
        .then((cookie) =>
          request(app)
            .put(`/v0/site/${siteModel.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              repository: 'new-repo-name',
            })
            .set('Cookie', cookie)
            .expect(200),
        );
    });

    it(`should not override existing attributes
        if they are not present in the request body`, (done) => {
      let site;
      const userPromise = factory.user();
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
        domain: 'https://example.com',
      });
      const cookiePromise = authenticatedSession(userPromise);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      })
        .then((results) => {
          ({ site } = results);

          return request(app)
            .put(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              notAValue: 'new: true',
            })
            .set('Cookie', results.cookie)
            .expect(200);
        })
        .then((response) => {
          validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
          return Site.findByPk(site.id);
        })
        .then((foundSite) => {
          expect(foundSite.domain).to.equal('https://example.com');
          done();
        })
        .catch(done);
    });

    it(`should ignore domain URLs in the request body
        if the URLs are managed by an associated domain`, (done) => {
      let site;
      const userPromise = factory.user();
      const sitePromise = factory.site({
        users: Promise.all([userPromise]),
        domain: 'https://example.com',
        demoDomain: 'https://demo.example.com',
      });
      const cookiePromise = authenticatedSession(userPromise);
      sinon.stub(DomainService, 'isSiteUrlManagedByDomain').returns(true);

      Promise.props({
        user: userPromise,
        site: sitePromise,
        cookie: cookiePromise,
      })
        .then((results) => {
          ({ site } = results);

          return request(app)
            .put(`/v0/site/${site.id}`)
            .set('x-csrf-token', csrfToken.getToken())
            .send({
              domain: 'https://changed.example.gov',
              demoDomain: 'https://new.example.gov',
            })
            .set('Cookie', results.cookie)
            .expect(200);
        })
        .then((response) => {
          validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
          return Site.findByPk(site.id);
        })
        .then((foundSite) => {
          expect(foundSite.domain).to.equal('https://example.com');
          expect(foundSite.demoDomain).to.equal('https://demo.example.com');
          done();
        })
        .catch(done);
    });

    it('should ignore non-engine params', async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: [user],
        repository: 'original',
      });
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

  describe('Site basic authentication API', () => {
    describe('DELETE /v0/site/:site_id/basic-auth', () => {
      describe('when the user is not authenticated', () => {
        it('returns a 403', async () => {
          const siteId = 1;

          const { body } = await request(app)
            .delete(`/v0/site/${siteId}/basic-auth`)
            .expect(403);

          validateAgainstJSONSchema('DELETE', '/site/{site_id}/basic-auth', 403, body);
        });
      });

      describe('when the site does not exist', () => {
        it('returns a 404', async () => {
          const siteId = 1;
          const user = await factory.user();
          const cookie = await authenticatedSession(user);

          const { body } = await request(app)
            .delete(`/v0/site/${siteId}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .expect(404);

          validateAgainstJSONSchema('DELETE', '/site/{site_id}/basic-auth', 404, body);
        });
      });

      describe('when the user is not authorized to see the site', () => {
        it('returns a 404', async () => {
          const [site, user] = await Promise.all([factory.site(), factory.user()]);
          const cookie = await authenticatedSession(user);

          const { body } = await request(app)
            .delete(`/v0/site/${site.id}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .expect(404);

          validateAgainstJSONSchema('DELETE', '/site/{site_id}/basic-auth', 404, body);
        });
      });

      describe('when the parameters are valid', () => {
        it('deletes basic auth from config and returns a 200', async () => {
          const userPromise = await factory.user();
          const siteConfig = {
            basicAuth: {
              username: 'user',
              password: 'password',
            },
            blah: 'blahblah',
          };
          let site = await factory.site({
            users: [userPromise],
            config: siteConfig,
          });

          const cookie = await authenticatedSession(userPromise);
          expect(site.config).to.deep.eq(siteConfig);
          await request(app)
            .delete(`/v0/site/${site.id}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .expect(200);

          site = await site.reload();
          expect(site.config).to.deep.equal({
            basicAuth: {},
            blah: 'blahblah',
          });
        });
      });
    });

    describe('POST /v0/site/:site_id/basic-auth', () => {
      describe('when the user is not authenticated', () => {
        it('returns a 403', async () => {
          const siteId = 1;

          const { body } = await request(app)
            .post(`/v0/site/${siteId}/basic-auth`)
            .type('json')
            .expect(403);

          validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 403, body);
        });
      });

      describe('when there is no csrf token', () => {
        it('returns a 403', async () => {
          const siteId = 1;
          const user = await factory.user();
          const cookie = await authenticatedSession(user);

          const { body } = await request(app)
            .post(`/v0/site/${siteId}/basic-auth`)
            .set('Cookie', cookie)
            .type('json')
            .expect(403);

          validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 403, body);
        });
      });

      describe('when the site does not exist', () => {
        it('returns a 404', async () => {
          const siteId = 1;
          const user = await factory.user();
          const cookie = await authenticatedSession(user);

          const { body } = await request(app)
            .post(`/v0/site/${siteId}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .expect(404);

          validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 404, body);
        });
      });

      describe('when the user is not authorized to see the site', () => {
        it('returns a 404', async () => {
          const [site, user] = await Promise.all([factory.site(), factory.user()]);
          const cookie = await authenticatedSession(user);

          const { body } = await request(app)
            .post(`/v0/site/${site.id}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .expect(404);

          validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 404, body);
        });
      });

      describe('when the parameters are not valid', () => {
        it('returns a 400', async () => {
          const userPromise = await factory.user();
          const site = await factory.site({
            users: [userPromise],
          });
          const cookie = await authenticatedSession(userPromise);
          const credentials = {
            // invalid password
            username: 'user',
            password: 'password',
          };

          const { body } = await request(app)
            .post(`/v0/site/${site.id}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .send(credentials)
            .expect(400);

          validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 400, body);
        });
      });

      describe('when the parameters are valid', () => {
        it('sets username and password for basic authentication', async () => {
          const userPromise = await factory.user();
          const site = await factory.site({
            users: [userPromise],
            config: {
              blah: 'blahblahblah',
            },
          });
          const cookie = await authenticatedSession(userPromise);
          const credentials = {
            username: 'user',
            password: 'paSsw0rd',
          };

          const { body } = await request(app)
            .post(`/v0/site/${site.id}/basic-auth`)
            .set('Cookie', cookie)
            .set('x-csrf-token', csrfToken.getToken())
            .type('json')
            .send(credentials)
            .expect(200);

          validateAgainstJSONSchema('POST', '/site/{site_id}/basic-auth', 200, body);
          await site.reload();
          expect(site.config).to.deep.equal({
            basicAuth: credentials,
            blah: 'blahblahblah',
          });
        });
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
        const user = await factory.user();
        const site = await factory.site({
          users: [user.id],
          demoBranch: 'demo',
        });
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
          const foundDomains = [domain1, domain2].find(
            (domain) => record.id === domain.id,
          );
          expect(foundDomains).not.to.be.undefined;
        });
      });

      it(`should return an empty list
          when no domains are associated with a site`, async () => {
        const user = await factory.user();
        const site = await factory.site({
          users: [user.id],
        });
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
        const user = await factory.user();
        const site = await factory.site({
          users: [user.id],
        });
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
});
