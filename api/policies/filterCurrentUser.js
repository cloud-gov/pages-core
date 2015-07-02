var querystring = require('querystring');
/**
 * Filter Current User Policy
 * Filters requested items to those matching the current user
 */
module.exports = function (req, res, next) {
  var reqID = req.params.id || req.params.parentid,
      association = _.find(req.options.associations, function(assoc) {
        return assoc.alias === 'users' || assoc.alias === 'user';
      }),
      model = req.options.model,
      path;

  // Reject if not logged in
  if (!req.user) return res.forbidden('Forbidden');

  // Evaluate whether user is associated with requested model
  if (reqID) {

    sails.models[req.options.model]
      .findOne({ id: reqID })
      .populate(association.alias)
      .exec(function(err, model) {
        if (err || !model) return res.forbidden('Forbidden');
        if (_.pluck(model.users, 'id').indexOf(req.user.id) < 0) {
          return res.forbidden('Forbidden');
        }
        return next();
      });

  } else {

    // Find route to populated listing, such as /v0/site => /v0/user/1/sites
    if (User.attributes[model + 's']) {
      path = [req.options.prefix, 'user', req.user.id, model + 's'].join('/') +
        '?' + querystring.stringify(req.query);
    }

    // Redirect to current user if requested model list
    if (req.options.action === 'find' && path) return res.redirect(path);

    // Reject all other requests
    res.forbidden('Forbidden');

  }

};
