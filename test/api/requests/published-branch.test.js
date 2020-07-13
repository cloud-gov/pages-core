const nock = require('nock');
const request = require('supertest');
const { expect } = require('chai');

const AWSMocks = require('../support/aws-mocks');
const mockTokenRequest = require('../support/cfAuthNock');
const apiNocks = require('../support/cfAPINocks');
const app = require('../../../app');
const config = require('../../../config');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');

describe('Published Branches API', () => {
  after(() => {
    AWSMocks.resetMocks();
  });

  afterEach(() => nock.cleanAll());

  describe('GET /v0/site/:site_id/published-branch', () => {
    it('should require authentication', (done) => {
      factory.site()
        .then(site => request(app).get(`/v0/site/${site.id}/published-branch`).expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 403, response.body);
          done();
        })
        .catch(done);
    });

    it('should throw 404 when site_id is NaN', (done) => {
      const user = factory.user();
      const site = factory.site({ users: Promise.all([user]), demoBranch: 'demo' });

      Promise.props({ user, site, cookie: authenticatedSession(user) })
        .then(promisedValues => request(app)
          .get('/v0/site/NaN/published-branch')
          .set('Cookie', promisedValues.cookie)
          .expect(404))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 404, response.body);
          done();
        }).catch(done);
    });

    it('should throw 404 when site_id does not exist', (done) => {
      const user = factory.user();
      const site = factory.site({ users: Promise.all([user]), demoBranch: 'demo' });

      Promise.props({ user, site, cookie: authenticatedSession(user) })
        .then(promisedValues => request(app)
          .get('/v0/site/-1/published-branch')
          .set('Cookie', promisedValues.cookie)
          .expect(404))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 404, response.body);
          done();
        }).catch(done);
    });

    it("should list the previews available on S3 for a user's site", (done) => {
      let site;
      const user = factory.user();
      const sitePromise = factory.site({ users: Promise.all([user]) });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(`preview/${site.owner}/${site.repository}/`);
        expect(params.Delimiter).to.equal('/');
        callback(null, {
          Contents: [],
          CommonPrefixes: [
            { Prefix: `preview/${site.owner}/${site.repository}/abc/` },
            { Prefix: `preview/${site.owner}/${site.repository}/def/` },
            { Prefix: `preview/${site.owner}/${site.repository}/ghi/` },
          ],
        });
      };

      Promise.props({ user, site: sitePromise, cookie: authenticatedSession(user) })
        .then((promisedValues) => {
          ({ site } = promisedValues);

          return request(app)
            .get(`/v0/site/${site.id}/published-branch`)
            .set('Cookie', promisedValues.cookie)
            .expect(200);
        }).then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 200, response.body);
          const branchNames = response.body.map(branch => branch.name);
          expect(branchNames).to.have.length(4);
          expect(branchNames).to.include(site.defaultBranch);
          expect(branchNames).to.include('abc');
          expect(branchNames).to.include('def');
          expect(branchNames).to.include('ghi');
          done();
        }).catch(done);
    });

    it('should list the demo branch if one is set on the site', (done) => {
      let site;
      const user = factory.user();
      const sitePromise = factory.site({ users: Promise.all([user]), demoBranch: 'demo' });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(`preview/${site.owner}/${site.repository}/`);
        expect(params.Delimiter).to.equal('/');
        callback(null, {
          Contents: [],
          CommonPrefixes: [
            { Prefix: `preview/${site.owner}/${site.repository}/abc/` },
          ],
        });
      };

      Promise.props({ user, site: sitePromise, cookie: authenticatedSession(user) })
        .then((promisedValues) => {
          ({ site } = promisedValues);

          return request(app)
            .get(`/v0/site/${site.id}/published-branch`)
            .set('Cookie', promisedValues.cookie)
            .expect(200);
        }).then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 200, response.body);
          const branchNames = response.body.map(branch => branch.name);
          expect(branchNames).to.deep.equal([site.defaultBranch, site.demoBranch, 'abc']);
          done();
        }).catch(done);
    });

    it('should 403 if the user is not associated with the site', (done) => {
      const user = factory.user();
      const site = factory.site();
      const cookie = authenticatedSession(user);

      Promise.props({ user, site, cookie })
        .then(promisedValues => request(app)
          .get(`/v0/site/${promisedValues.site.id}/published-branch`)
          .set('Cookie', promisedValues.cookie)
          .expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 403, response.body);
          done();
        }).catch(done);
    });

    it('returns a 400 if the access keys are invalid', (done) => {
      let site;
      const expected = 'S3 keys out of date. Update them with `npm run update-local-config`';
      const user = factory.user();
      const sitePromise = factory.site({ users: Promise.all([user]), demoBranch: 'demo' });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        callback({ status: 403, code: 'InvalidAccessKeyId' }, {});
      };

      Promise.props({ user, site: sitePromise, cookie: authenticatedSession(user) })
        .then((promisedValues) => {
          ({ site } = promisedValues);

          return request(app)
            .get(`/v0/site/${site.id}/published-branch`)
            .set('Cookie', promisedValues.cookie)
            .expect(400);
        }).then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch', 400, response.body);
          throw response.body;
        }).catch((error) => {
          expect(error.message).to.equal(expected);
          done();
        });
    });
  });

  describe('GET /v0/site/:site_id/published-branch/:branch', () => {
    it('should require authentication', (done) => {
      factory.site().then(site => request(app)
        .get(`/v0/site/${site.id}/published-branch/${site.defaultBranch}`)
        .expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch/{branch}', 403, response.body);
          done();
        }).catch(done);
    });

    it('should render a JSON response for a pubslished branch', (done) => {
      let site;
      const user = factory.user();
      const sitePromise = factory.site({ defaultBranch: 'main', users: Promise.all([user]) });

      Promise.props({ user, site: sitePromise, cookie: authenticatedSession(user) })
        .then((promisedValues) => {
          ({ site } = promisedValues);

          return request(app)
            .get(`/v0/site/${site.id}/published-branch/main`)
            .set('Cookie', promisedValues.cookie)
            .expect(200);
        }).then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch/{branch}', 200, response.body);
          expect(response.body.site.id).to.equal(site.id);
          expect(response.body.name).to.equal('main');
          done();
        }).catch(done);
    });

    it('should 403 if the user is not associated with the site', (done) => {
      const user = factory.user();
      const site = factory.site({ defaultBranch: 'main' });
      const cookie = authenticatedSession(user);

      Promise.props({ user, site, cookie })
        .then(promisedValues => request(app)
          .get(`/v0/site/${promisedValues.site.id}/published-branch/main`)
          .set('Cookie', promisedValues.cookie)
          .expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch/{branch}', 403, response.body);
          done();
        }).catch(done);
    });

    it('should require site id is a Number', (done) => {
      const user = factory.user();
      const site = factory.site({ defaultBranch: 'main', users: Promise.all([user]) });

      Promise.props({ user, site, cookie: authenticatedSession(user) })
        .then(promisedValues => request(app)
          .get('/v0/site/NaN/published-branch/main')
          .set('Cookie', promisedValues.cookie)
          .expect(404))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch/{branch}', 404, response.body);
          done();
        }).catch(done);
    });

    it('should require site id is in the sites table', (done) => {
      const user = factory.user();
      const site = factory.site({ defaultBranch: 'main', users: Promise.all([user]) });

      Promise.props({ user, site, cookie: authenticatedSession(user) })
        .then(promisedValues => request(app)
          .get('/v0/site/-1/published-branch/main')
          .set('Cookie', promisedValues.cookie)
          .expect(404))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/site/{site_id}/published-branch/{branch}', 404, response.body);
          done();
        }).catch(done);
    });
  });
});
