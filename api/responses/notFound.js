module.exports = (error = {}, { res }) => {
  res.status(404);
  return res.json({
    message: error.message || 'Not found',
    status: 404,
  });
};
