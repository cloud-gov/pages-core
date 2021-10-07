const { defaultContext } = require('../utils');

// eslint-disable-next-line no-unused-vars
function fourOhFourHandler(req, res) {
  const context = defaultContext(req, res);
  if (req.session.authenticated) {
    context.isAuthenticated = true;
    context.username = req.user.username;
  }

  res.status(404).render('404.njk', context);
}
module.exports = fourOhFourHandler;
