/* eslint-disable no-console */
const fs = require('fs');
const factory = require('../test/api/support/factory');
const { authenticatedSession } = require('../e2e/auth-session');

async function createUsers() {
  const user = await factory.user({ username: 'test-e2e-user' });
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

  fs.writeFileSync('playwright/.auth/user.json', JSON.stringify(
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
