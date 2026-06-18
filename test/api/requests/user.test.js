const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');
const githubAPINocks = require('../support/githubAPINocks');
const config = require('../../../config');

describe('User API', () => {
  const userResponseExpectations = (response, user) => {
    expect(response).to.have.property('id', user.id);
    expect(response).to.have.property('username', user.username);
    expect(response).to.have.property('email', user.email);
  };

  describe('GET /v0/me', () => {
    it('should require authentication', (done) => {
      factory
        .user()
        .then(() => request(app).get('/v0/me').expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/me', 403, response.body);
          done();
        });
    });

    it('should render the current user', (done) => {
      let user;

      factory
        .user()
        .then((model) => {
          user = model;
          return authenticatedSession(user);
        })
        .then((cookie) => request(app).get('/v0/me').set('Cookie', cookie).expect(200))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/me', 200, response.body);
          userResponseExpectations(response.body, user);
          done();
        })
        .catch(done);
    });
  });

  describe('DELETE /v0/me/githubtoken', () => {
    it('should return the same response no matter what', async () => {
      githubAPINocks.revokeApplicationGrant({
        clientID: config.passport.github.options.clientID,
        responseCode: 200,
      });
      const user = await factory.user();
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .delete('/v0/me/githubtoken')
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .send()
        .expect(200);

      validateAgainstJSONSchema('DELETE', '/me/githubtoken', 200, response.body);
    });
  });
});
