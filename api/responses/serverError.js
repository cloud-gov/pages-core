module.exports = (error, { req, res }) => {
  res.status(500)
  return res.json({
    message: "Internal server error",
    status: 500,
  })
}
