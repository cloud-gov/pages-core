const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');

describe('User API', () => {
  const userResponseExpectations = (response, user) => {
    expect(response).to.have.property('id', user.id);
    expect(response).to.have.property('username', user.username);
    expect(response).to.have.property('email', user.email);
  };

  describe('GET /v0/me', () => {
    it('should require authentication', (done) => {
      factory.user().then(() => request(app)
        .get('/v0/me')
        .expect(403)).then((response) => {
        validateAgainstJSONSchema('GET', '/me', 403, response.body);
        done();
      });
    });

    it('should render the current user', (done) => {
      let user;

      factory.user()
        .then((model) => {
          user = model;
          return authenticatedSession(user);
        })
        .then(cookie => request(app)
          .get('/v0/me')
          .set('Cookie', cookie)
          .expect(200))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/me', 200, response.body);
          userResponseExpectations(response.body, user);
          done();
        })
        .catch(done);
    });
  });
});
