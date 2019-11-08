const GitHub = require('../services/GitHub');
const siteErrors = require('../responses/siteErrors');
const { User, Site } = require('../models');

const authorize = ({ username }) =>
  FederalistUsersHelper.federalistUsersAdmins(username)
    .then((admins) => {
      if (!admins.includes(username)) {
        throw {
          message: 'You are not authorized to perform this action',
          status: 403,
        };
      }
    })          

const create = () => authorize(user, site);

module.exports = {
  create,
};
