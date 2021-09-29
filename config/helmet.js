/*
 Options to pass to helmet
 See https://helmetjs.github.io/
 for all options available
*/
module.exports = {
  contentSecurityPolicy: {
    directives: {
      'default-src': [
        "'self'",
      ],
      'base-uri': [
        "'self'",
      ],
      'connect-src': [
        "'self'",
        'www.google-analytics.com',
      ],
      'font-src': [
        "'self'",
        'https:', 'data:',
      ],
      'frame-ancestors': [
        "'none'",
      ],
      'form-action': [
        "'self'",
      ],
      'img-src': [
        "'self'",
        'data:',
      ],
      'object-src': [
        "'none'",
      ],
      'script-src': [
        "'self'",
        'www.googletagmanager.com',
        'dap.digitalgov.gov',
        'www.google-analytics.com',
        (_, res) => `'nonce-${res.locals.cspNonce}'`,
      ],
      'script-src-attr': [
        "'none'",
      ],
      'style-src': [
        "'self'",
        'https:',
        "'unsafe-inline'",
      ],
      'block-all-mixed-content': [],
    },
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: false,
  hsts: false,
};
