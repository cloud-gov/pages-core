/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
  // User is allowed, proceed to the next policy,
  // or if this is the last policy, the controller
  if (req.session.authenticated) {
    return next();
  }

  if (req.path && req.path.indexOf('/preview/') === 0) {

    if (!req.param('owner') || !req.param('repo') || !req.param('branch')) {
      return res.redirect('/?error=preview.login');
    }

    Site.findOne({
      owner: req.param('owner'),
      repository: req.param('repo')
    }).exec(function(err, site) {
      if (err || !site) return res.badRequest();
      if (!site.publicPreview) return res.redirect('/?error=preview.login');
      next();
    });

  } else {

    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    return res.forbidden('You are not permitted to perform this action. Are you sure you are logged in?');

  }
};
