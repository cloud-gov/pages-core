function cacheControl(value) {
  return function cacheControlMiddleware(req, res, next) {
    res.set('Cache-Control', value);
    next();
  };
}

module.exports = cacheControl;
