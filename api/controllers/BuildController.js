var decodeb64 = (str) => {
  return new Buffer(str, 'base64').toString('utf8');
}

module.exports = {
  status: function(req, res) {
    var message = decodeb64(req.body.message)

    Build.findOne(req.param("id")).then(build => {
      if (!build) {
        var error = new Error(`Unable to find build with id: ${req.param("id")}`)
        error.statusCode = 404
        throw error
      } else {
        return Build.completeJob(message, build)
      }
    }).then(build => {
      res.ok()
    }).catch(err => {
      if (err.statusCode == 404) {
        res.notFound()
      } else {
        res.serverError()
        sails.log.error(err)
      }
    })
  }
}
