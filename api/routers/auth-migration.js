const router = require('express').Router();

const AuthMigrationController = require('../controllers/auth-migration');
const { csrfProtection, parseForm } = require('../middlewares');

function requireAuthentication(req, res, next) {
  if (!req.session.authenticated) {
    req.flash('error', 'You are not permitted to perform this action. Are you sure you are logged in?');
    return res.redirect('/');
  }
  return next();
}

router.get('/migrate/new', requireAuthentication, csrfProtection, AuthMigrationController.new);
router.post('/migrate/create', requireAuthentication, parseForm, csrfProtection, AuthMigrationController.create);
router.get('/migrate/success', requireAuthentication, AuthMigrationController.success);

module.exports = router;
