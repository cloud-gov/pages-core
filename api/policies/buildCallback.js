/**
 * Build Callback Policy
 * Requests must have a `token` param that matches config and an `id`
 */
module.exports = function (req, res, next) {
  if (req.param('token') !== sails.config.build.token) {
    return res.badRequest();
  }
  next();
};
