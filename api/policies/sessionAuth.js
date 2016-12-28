module.exports = function(req, res, next) {
  if (req.session.authenticated) {
    return next();
  } else {
    return res.forbidden('You are not permitted to perform this action. Are you sure you are logged in?');
  }
};
