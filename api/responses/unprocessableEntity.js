module.exports = (error = {}, { res }) => {
  res.status(422);
  return res.json({
    errors: error.errors,
    message: error.message || 'Unprocessable Entity',
    status: 422,
  });
};
