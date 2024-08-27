/* eslint-disable no-console */
const fs = require('fs');
const factory = require('../test/api/support/factory');
const { Organization, Role } = require('../api/models');
const { authenticatedSession } = require('../e2e/auth-session');

function createCookie(name, value, domain) {
  return {
    name,
    value,
    domain,
    path: '/',
    expires: (Number(new Date()) + (24 * 60 * 60 * 1000)) / 1000,
    httpOnly: true,
    secure: process.env.APP_ENV === 'production',
    sameSite: 'Lax',
    // for testing only
    label: domain.replace(/([a-z]*)\..*/, '$1'),
  };
}

async function createUsers() {
  const org = await Organization.findOne({ where: { name: 'testing-org' } }); // exists in all environments
  const userRole = await Role.findOne({ where: { name: 'user' } }); // exists in all environments
  const user = await factory.user({ username: process.env.PAGES_TEST_USER || 'generic-test-user' });

  await org.addUser(user, { through: { roleId: userRole.id } });

  const [name, value] = (await authenticatedSession(user)).split('=');
  const cookie = createCookie(name, value, process.env.DOMAIN);
  const cookies = [cookie];

  if (process.env.ADMIN_COOKIE) {
    const [adminName, adminValue] = (await authenticatedSession(user, 'admin')).split('=');
    const adminCookie = createCookie(adminName, adminValue, `admin.${process.env.DOMAIN}`);
    cookies.push(adminCookie);
  }
  if (process.env.QUEUES_COOKIE) {
    const [queuesName, queuesValue] = (await authenticatedSession(user, 'queues')).split('=');
    const queuesCookie = createCookie(queuesName, queuesValue, `queues.${process.env.DOMAIN}`);
    cookies.push(queuesCookie);
  }

  fs.writeFileSync('user.json', JSON.stringify(
    { cookies }
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
