const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');

const createUser = require('../support/factory/user');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { requiresAuthentication } = require('./shared');

describe('Role API', () => {
  describe('GET /v0/role', () => {
    requiresAuthentication('GET', '/role');

    it('returns the roles', async () => {
      const user = await createUser();
      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get('/v0/role')
        .set('Cookie', cookie);

      validateAgainstJSONSchema('GET', '/role', 200, response.body);
      expect(response.body.map(r => r.name)).to.have.members(['user', 'manager']);
    });
  });
});
