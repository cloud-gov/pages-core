module.exports = function badRequest(error = {}, options) {
  const res = this.res;

  sails.log.verbose('Sending 400 ("Bad Request") response: \n', error)

  res.status(400)
  return res.json({
    message: error.message || "Bad Request",
    status: 400,
  })
}
