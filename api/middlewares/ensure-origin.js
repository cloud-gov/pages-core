const ensureOrigin = expectedOrigin => (req, res, next) => {
  if (req.headers.origin !== expectedOrigin) {
    return res.unauthorized();
  }
  return next();
};

module.exports = ensureOrigin;
