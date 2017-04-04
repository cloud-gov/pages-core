module.exports = (error = {}, { req, res }) => {
  res.status(403)
  return res.json({
    message: error.message || "You are not authorized to perform that action",
    status: 403,
  })
}
