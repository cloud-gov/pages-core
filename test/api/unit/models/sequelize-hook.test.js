const { expect } = require('chai');
const { OrganizationRole, Role, User } = require('../../../../api/models');
const orgFactory = require('../../support/factory/organization');
const createUser = require('../../support/factory/user');

function clean() {
  return Promise.all([
    orgFactory.truncate(),
    OrganizationRole.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('Sequelize', () => {
  let userRole;
  let managerRole;

  before(async () => {
    await clean();
    [userRole, managerRole] = await Promise.all([
      Role.findOne({ where: { name: 'user' } }),
      Role.findOne({ where: { name: 'manager' } }),
    ]);
  });

  afterEach(clean);

  // This test fails without the beforeCount hook in api/models/index.js
  describe('global beforeCount hook', () => {
    it('calculates count consistently', async () => {
      const [user1, user2, org1, org2] = await Promise.all([
        createUser(),
        createUser(),
        orgFactory.create(),
        orgFactory.create(),
      ]);

      await Promise.all([
        org1.addUser(user1, { through: { roleId: managerRole.id } }),
        org1.addUser(user2, { through: { roleId: userRole.id } }),
        org2.addUser(user1, { through: { roleId: userRole.id } }),
      ]);

      const model = User.scope('withOrganizationRoles');
      const { rows, count } = await model.findAndCountAll();

      expect(rows.length).to.eq(2);
      expect(rows.length).to.eq(count);
    });
  });
});
