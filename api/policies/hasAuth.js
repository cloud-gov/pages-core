/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Policy to redirect to the home page if user is unathenticated
 *                 Assumes that your login action in one of your controllers
 *                 sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }

  return res.redirect('/');
};
