const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');

const { Organization, Role, User } = require('../../../api/models');

const authErrorMessage = 'You are not permitted to perform this action. Are you sure you are logged in?';

describe('Organization API', () => {
  const organizationResponseExpectations = (response, org) => {
    expect(response.id).to.equal(org.id);
    expect(response.name).to.equal(org.name);
  };

  function clean() {
    return Promise.all([
      Organization.truncate({ force: true, cascade: true }),
      User.truncate({ force: true, cascade: true }),
    ]);
  }

  describe('GET /v0/organization', () => {
    beforeEach(clean);

    after(clean);

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/v0/organization');

      validateAgainstJSONSchema('GET', '/organization', 403, response.body);
      expect(response.statusCode).to.equal(403);
      expect(response.body.message).to.equal(authErrorMessage);
    });

    it('should render a list of organizations associated with the user', async () => {
      const [user, org1, org2, role1, role2] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        factory.organization.create(),
        Role.findOne({ name: 'user' }),
        Role.findOne({ name: 'manager' }),
        factory.organization.create(),
      ]);

      await Promise.all([
        user.addOrganization(org1, { through: { roleId: role1.id } }),
        user.addOrganization(org2, { through: { roleId: role2.id } }),
      ]);

      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/organization')
        .set('Cookie', cookie);

      validateAgainstJSONSchema('GET', '/organization', 200, response.body);
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(2);

      const foundOrganizations = await Promise.all(
        response.body.map(org => Organization.findByPk(org.id, { include: [User] }))
      );

      return foundOrganizations.forEach((org) => {
        const responseOrg = response.body.find(candidate => candidate.id === org.id);
        expect(responseOrg).not.to.be.undefined;
        organizationResponseExpectations(responseOrg, org);
      });
    });

    it('should not render any organizations not associated with the user', async () => {
      const user = factory.user();
      const organizationPromises = Array(3).fill(0).map(() => factory.organization.create());
      const organizations = await Promise.all(organizationPromises);

      expect(organizations).to.have.length(3);

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get('/v0/site')
        .set('Cookie', cookie);

      expect(response.statusCode).to.equal(200);

      validateAgainstJSONSchema('GET', '/organization', 200, response.body);
      expect(response.body).to.be.a('array');
      expect(response.body).to.be.empty;
    });
  });
});
