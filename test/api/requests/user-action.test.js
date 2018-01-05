const { expect } = require('chai');
const app = require('../../../app');
const request = require('supertest');
const { authenticatedSession, unauthenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');
const factory = require('../support/factory');
const { UserAction } = require('../../../api/models');


const version = '/v0';
const resource = 'site';
const route = 'user-action';

const notAuthorizedError = 'You are not permitted to perform this action. Are you sure you are logged in?';

const path = id => `${version}/${resource}/${id}/${route}`;

const makeGetRequest = (expectedCode, { id, cookie = null }) => {
  const baseRequest = request(app).get(path(id));

  if (cookie) {
    baseRequest.set('Cookie', cookie);
  }

  return baseRequest.expect(expectedCode);
};

const createUserActions = (number, options = {}) =>
  Promise.all(
    Array.apply(null, { length: number }).map(() =>
      UserAction.create(Object.assign({}, {
        userId: 1,
        actionId: 1,
        targetType: 'user',
        targetId: 2,
      }, options))
    )
  );

const buildAuthenticatedSession = () =>
  factory.user()
  .then(authenticatedSession);

describe('UserAction API', () => {
  describe('GET v0/site/:site_id/user-action', () => {
    it('requires authentication', (done) => {
      factory.site()
      .then(site =>
        makeGetRequest(403, { id: site.id })
      )
      .then((response) => {
        validateAgainstJSONSchema('GET', '/site/{site_id}/user-action', 403, response.body);
        expect(response.body.message).to.equal(notAuthorizedError);
        done();
      })
      .catch(done);
    });

    it('returns a 404 if the site with supplied id does not exist', (done) => {
      buildAuthenticatedSession()
      .then(cookie =>
        makeGetRequest(404, {id: 0, cookie })
      )
      .then((response) => {
        validateAgainstJSONSchema('GET', '/site/{site_id}/user-action', 404, response.body);
        expect(response.body.message).to.equal('Not found');
        done();
      })
      .catch(done);
    });

    it('returns a list of user actions associated with a site', (done) => {
      let currentSite;

      factory.site()
      .then(site => {
        currentSite = site;
        createUserActions(2, { siteId: site.id });
      })
      .then(buildAuthenticatedSession)
      .then(cookie =>
        makeGetRequest(200, { id: currentSite.id, cookie })
      )
      .then((response) => {
        console.log(response.body);
        done();
      })
      .catch(done);
    })
  });
});
