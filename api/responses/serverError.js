module.exports = function badRequest(error = {}, options) {
  const res = this.res;

  sails.log.error('Sending 500 ("Server Error") response: \n', error)

  res.status(500)
  return res.json({
    message: "Internal server error",
    status: 500,
  })
}
