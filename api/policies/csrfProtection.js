const csurf = require('csurf');

const csrfProtection = csurf();

module.exports = csrfProtection;
