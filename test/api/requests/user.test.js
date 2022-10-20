const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');

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

  describe('PUT /v0/me/settings', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/v0/me/settings')
        .expect(403);

      validateAgainstJSONSchema('PUT', '/me/settings', 403, response.body);
    });

    it('should require a valid CSRF token', async () => {
      const user = await factory.user();
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .put('/v0/me/settings')
        .set('Cookie', cookie)
        .set('x-csrf-token', 'bad-token')
        .send({})
        .expect(403);

      validateAgainstJSONSchema('PUT', '/me/settings', 403, response.body);
    });

    it('should require valid input', async () => {
      const user = await factory.user();
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .put('/v0/me/settings')
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .send({})
        .expect(400);

      validateAgainstJSONSchema('PUT', '/me/settings', 400, response.body);
    });

    it('should update the user settings and return the user', async () => {
      const user = await factory.user();
      const cookie = await authenticatedSession(user);

      expect(user.buildNotificationSettings[1]).to.eq(undefined);

      const response = await request(app)
        .put('/v0/me/settings')
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          buildNotificationSettings: {
            1: 'builds',
          },
        })
        .expect(200);

      validateAgainstJSONSchema('PUT', '/me/settings', 200, response.body);

      expect(response.body.buildNotificationSettings[1]).to.eq('builds');
    });
  });

  describe('DELETE /v0/me/githubtoken', () => {
    it('should return the same response no matter what', async () => {
      const user = await factory.user();
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .delete('/v0/me/token')
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .send()
        .expect(200);

      validateAgainstJSONSchema('DELETE', '/me/githubtoken', 200, response.body);
    });
  });
});
