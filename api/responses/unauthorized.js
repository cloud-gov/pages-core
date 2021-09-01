module.exports = (error = {}, { res }) => {
  res.status(401);
  return res.json({
    message: error.message || 'Unauthorized',
    status: 401,
  });
};
