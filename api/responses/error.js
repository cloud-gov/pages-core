module.exports = (error = {}, { res }) => {
  let finalError = error;

  if (typeof error === 'number') {
    finalError = {
      status: error,
    };
  } else if (error.name && error.name === 'SequelizeValidationError') {
    finalError = {
      status: 400,
      message: 'The request parameters were invalid.',
    };
  }

  const status = parseInt(finalError.status, 10) || 500;

  switch (status) {
    case 400:
      res.badRequest(finalError);
      break;
    case 403:
      res.forbidden(finalError);
      break;
    case 404:
      res.notFound(finalError);
      break;
    case 500:
    default:
      res.serverError(finalError);
  }
};
