module.exports = function (req, res, next) {
  Build.findOne(req.param("id") || req.param("build_id")).then(build => {
    if (!build) {
      res.notFound()
    } else if (build.token !== req.param("token")) {
      res.forbidden()
    } else {
      next()
    }
  })
}
