/* eslint-disable no-unused-vars */
module.exports = (_error = {}, { res }) => {
  res.status(500);
  return res.json({
    message: 'An unexpected error occurred',
    status: 500,
  });
};
/* eslint-enable no-unused-vars */
