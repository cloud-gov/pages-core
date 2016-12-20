module.exports = function (req, res, next) {
  if (req.param('token') !== sails.config.build.token) {
    return res.badRequest();
  }
  next();
};
