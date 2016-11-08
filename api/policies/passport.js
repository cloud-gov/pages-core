module.exports = function (req, res, next) {
  passport.initialize()(req, res, function () {
    passport.session()(req, res, function () {
      res.locals.user = req.user;
      next();
    });
  });
};
