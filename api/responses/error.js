const { DatabaseError } = require('sequelize');
const { ValidationError } = require('../utils/validators');

module.exports = (error = {}, { res }) => {
  let finalError = error;

  if (typeof error === 'number') {
    finalError = {
      status: error,
    };
  } else if (error.code === 'EBADCSRFTOKEN') {
    finalError = {
      status: 403,
      message: 'Invalid CSRF token',
    };
  } else if (error instanceof ValidationError || (error.name && error.name === 'SequelizeValidationError')) {
    finalError = {
      status: 400,
      message: 'The request parameters were invalid.',
    };
  } else if (error instanceof DatabaseError) {
    finalError = {
      status: 404,
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
