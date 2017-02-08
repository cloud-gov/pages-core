module.exports = function (req, res, next) {
  const id = Number(req.param("id") || req.param("build_id"))

  Promise.resolve(id).then(id => {
    if (isNaN(id)) {
      throw 404
    }
    return Build.findById(id)
  }).then(build => {
    if (!build) {
      res.notFound()
    } else if (build.token !== req.param("token")) {
      res.forbidden()
    } else {
      next()
    }
  }).catch(err => {
    res.error(err)
  })
}
