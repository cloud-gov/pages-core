module.exports = (error = {}, { res }) => {
  res.status(401);
  return res.json({
    message: error.message || 'Unauthorized. If you require access to Federalist, please click <a href="https://federalist.18f.gov/documentation/access-permissions/#personal-access">here</a> to view our documentation.',
    status: 401,
  });
};
