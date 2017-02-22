module.exports = (req, res, next) => {
  res.badRequest = (data) => require("./badRequest")(data, { req, res })
  res.error = (data) => require("./error")(data, { req, res })
  res.forbidden = (data) => require("./forbidden")(data, { req, res })
  res.notFound = (data) => require("./notFound")(data, { req, res })
  res.ok = (data) => require("./ok")(data, { req, res })
  res.serverError = (data) => require("./serverError")(data, { req, res })
  next()
}
