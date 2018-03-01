module.exports = (error = {}, { res }) => {
  res.status(400);
  return res.json({
    message: error.message || 'Bad Request',
    status: 400,
  });
};
