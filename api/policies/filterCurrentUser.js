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
        // not all models have many users, wrap one an array
        var users = model.users || [model.user];

        if (err || !model) return res.forbidden('Forbidden');
        if (_.pluck(users, 'id').indexOf(req.user.id) < 0) {
          return res.forbidden('Forbidden');
        }
        return next();
      });

  } else {

    // If requested model is associated with a user, get the records
    // associated with the request user
    if (User.attributes[model + 's']) {
      User.findOne({
        id: req.user.id
      }).populate(model + 's').exec(function(err, user) {
        if (err) return res.forbidden('Forbidden');
        req.query.where = JSON.stringify({
          id: _.pluck(user[model + 's'], 'id')
        });
        return next();
      });
    } else {

      // Reject all other requests
      res.forbidden('Forbidden');
    }
  }

};
