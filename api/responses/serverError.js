const logger = require("winston")

module.exports = (error = {}, { req, res }) => {
  logger.error("Sending 500: ", error)

  res.status(500)
  return res.json({
    message: "Internal server error",
    status: 500,
  })
}
