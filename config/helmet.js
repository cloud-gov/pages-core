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
        'https://www.google-analytics.com/j/collect',
      ],
      'font-src': [
        "'self'",
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
        'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js',
        'https://www.google-analytics.com/analytics.js',
        (_, res) => `'nonce-${res.locals.cspNonce}'`,
      ],
      'script-src-attr': [
        "'none'",
      ],
      'style-src': [
        "'self'",
      ],
      'child-src': [
        "'none'",
      ],
      'frame-src': [
        "'none'",
      ],
      'worker-src': [
        "'none'",
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
