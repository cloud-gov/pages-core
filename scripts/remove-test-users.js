/* eslint-disable no-console */
const { Op } = require('sequelize');
const { User } = require('../api/models');

async function removeUsers() {
  await User.destroy({
    where: {
      username: {
        [Op.like]: '%-e2e-%',
      },
    },
    force: true,
  });
}

removeUsers()
  .then(() => {
    console.log('Done!');
    process.exit();
  })
  .catch((error) => {
    console.error('Uh oh, we have a problem!');
    console.error(error);
    process.exit(1);
  });
