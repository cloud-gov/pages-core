module.exports = (_error = {}, { res }) => {
  res.status(500);
  return res.json({
    message: 'An unexpected error occurred',
    status: 500,
  });
};
