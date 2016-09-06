/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  /*
  *
  * Load passport autentication strategies
  * https://github.com/kasperisager/sails-generate-auth#requirements
  *
  */
  sails.services.passport.loadStrategies();

  // Use local tunnel for development
  //if (sails.config.environment === 'development') {
  //   var localtunnel = require('localtunnel'), tunnel;
  //   tunnel = localtunnel(sails.config.port, function(err, tunnel) {
  //     if (err) console.error(new Error('Failed to start tunnel'));
  //     sails.config.webhook.endpoint = tunnel.url + '/webhook/github';
  //     sails.log.verbose('Development: using localtunnel for webhook: ',
  //       sails.config.webhook.endpoint);
  //     cb();
  //   });
  // } else {
  //   cb();
  //}

  cb();
};
