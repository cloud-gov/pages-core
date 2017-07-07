module.exports = function sessionAuth(req, res, next) {
  req.session.authRedirectPath = undefined;
  if (req.session.authenticated) {
    return next();
  }
  return res.forbidden({
    message: 'You are not permitted to perform this action. Are you sure you are logged in?',
  });
};
