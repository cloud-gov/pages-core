/**
 * BuildController
 *
 * @description :: Server-side logic for managing builds
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

function decodeb64 (str) {
  return new Buffer(str, 'base64').toString('utf8');
}

module.exports = {

  // Endpoint for status updates for builds by external builders
  status: function(req, res) {

    var message = decodeb64(req.body.message);

    Build.findOne(req.param('id')).exec(function(err, build) {
      if (err) res.send(err);

      Build.completeJob(message, build);
      res.ok();

    });

  }

};
