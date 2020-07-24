// const passport = require('../../services/passport');
// const config = require('../../../config');

// const AdminAuthController = {
//   logout(req, res) {
//     passport.logout(req, res);
//   },

//   github(req, res) {
//     if (req.session.adminAuthenticated) {
//       res.redirect(config.app.homepageUrl);
//     } else {
//       passport.authenticate('admin-auth')(req, res, req.next);
//     }
//   },

//   callback(req, res) {
//     passport.callback(req, res);
//   },
// };

// module.exports = AdminAuthController;
