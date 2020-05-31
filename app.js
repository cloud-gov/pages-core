const app = require('./api/express');
const init = require('./api/init');

init(app);

module.exports = app;
