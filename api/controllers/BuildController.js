/**
 * BuildController
 *
 * @description :: Server-side logic for managing builds
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  // Endpoint for status updates for builds by external builders
  status: function(req, res) {
    var status = req.body.status,
        message = req.body.message;

    Build.findOne(req.param('id')).exec(function(err, build) {

      if (+status !== 0) {
        build.state = 'error';
        build.error = message;
      } else {
        build.state = 'success';
      }

      build.save(function(err, build) {
        if (err) return res.serverError(err);
        res.send(build);
      });

    });

  }

};
