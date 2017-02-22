module.exports = (error, { req, res }) => {
  if (typeof error === "number") {
    error = {
      status: error,
    }
  } else if (error.name && error.name === "SequelizeValidationError") {
    error = {
      status: 400,
      message: "The request parameters were invalid."
    }
  }

  const status = parseInt(error.status) || 500

  switch(status) {
    case 400:
      res.badRequest(error)
      break
    case 403:
      res.forbidden(error)
      break
    case 404:
      res.notFound(error)
      break
    case 500:
    default:
      res.serverError(error)
  }
}
