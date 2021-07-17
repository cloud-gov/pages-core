module.exports = (error = {}, { res }) => {
  res.status(422);
  return res.json({
    message: error.message || 'Unprocessable Entity',
    status: 422,
  });
};
