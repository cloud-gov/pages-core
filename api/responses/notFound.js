module.exports = function badRequest(error = {}, options) {
  const res = this.res;

  sails.log.verbose('Sending 404 ("Not found") response: \n', error)

  res.status(404)
  return res.json({
    message: error.message || "Not found",
    status: 404,
  })
}
