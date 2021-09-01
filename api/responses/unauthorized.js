module.exports = (error = {}, { res }) => {
  res.status(401);
  return res.json({
    message: error.message || 'Unauthorized. If you need access to Federalist, please message #federalist-support on Slack and include your GitHub username.',
    status: 401,
  });
};
