const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');

const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');

function requiresAuthentication(method, path, schema) {
  const statusCode = 403;
  const message =
    'You are not permitted to perform this action. Are you sure you are logged in?';

  it('requires authentication', async () => {
    const response = await request(app)[method.toLowerCase()](`/v0${path}`);

    validateAgainstJSONSchema(method, schema || path, statusCode, response.body);
    expect(response.statusCode).to.equal(statusCode);
    expect(response.body.message).to.equal(message);
  });
}

module.exports = {
  requiresAuthentication,
};
