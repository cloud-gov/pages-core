module.exports = function badRequest(error = {}, options) {
  const res = this.res;

  sails.log.verbose('Sending 403 ("Forbidden") response: \n', error)

  res.status(403)
  return res.json({
    message: error.message || "You are not authorized to perform that action",
    status: 403,
  })
}
