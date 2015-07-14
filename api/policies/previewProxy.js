module.exports = function(req, res, next) {
  if (!req.param('owner') || !req.param('repo') || !req.param('branch')) {
    return res.badRequest();
  }

  Site.findOne({
    owner: req.param('owner'),
    repository: req.param('repo')
  }).populate('users').exec(function(err, site) {
    if (err || !site) return res.badRequest();
    var userHasAccess = _(site.users).pluck('id').contains(req.user.id);
    if (!userHasAccess) return res.badRequest();
    next();
  });

};
