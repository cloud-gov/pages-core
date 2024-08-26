/* eslint-disable no-console */
const fs = require('fs');
const factory = require('../test/api/support/factory');
const { Organization, Role } = require('../api/models');
const { authenticatedSession } = require('../e2e/auth-session');

async function createUsers() {
  const org = await Organization.findOne({ where: { name: 'testing-org' } }); // exists in all environments
  const userRole = await Role.findOne({ where: { name: 'user' } }); // exists in all environments
  const user = await factory.user({ username: process.env.PAGES_TEST_USER || 'generic-test-user' });

  await org.addUser(user, { through: { roleId: userRole.id } });

  const [name, value] = (await authenticatedSession(user)).split('=');
  const cookie = {
    name,
    value,
    domain: process.env.DOMAIN,
    path: '/',
    expires: (Number(new Date()) + (24 * 60 * 60 * 1000)) / 1000,
    httpOnly: true,
    secure: process.env.APP_ENV === 'production',
    sameSite: 'Lax',
  };

  fs.writeFileSync('user.json', JSON.stringify(
    { cookies: [cookie] }
  ));
}

createUsers()
  .then(() => {
    console.log('Done!');
    process.exit();
  })
  .catch((error) => {
    console.error('Uh oh, we have a problem!');
    console.error(error);
    process.exit(1);
  });
