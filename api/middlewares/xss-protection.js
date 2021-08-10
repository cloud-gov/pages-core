function xssProtection(req, res, next) {
  res.set('X-XSS-Protection', '1; mode=block');
  next();
}

module.exports = xssProtection;
