const { Build } = require('../models');

module.exports = (req, res, next) => {
  const normalizedId = Number(req.params.id || req.params.build_id);

  Promise.resolve(normalizedId).then((id) => {
    if (isNaN(id)) {
      throw 404;
    }
    return Build.findById(id);
  }).then((build) => {
    if (!build) {
      res.notFound();
    } else if (build.token !== req.params.token) {
      res.forbidden();
    } else {
      next();
    }
  }).catch((err) => {
    res.error(err);
  });
};
