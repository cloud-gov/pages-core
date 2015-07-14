var AWS = require('aws-sdk'),
    s3 = new AWS.S3();

module.exports = {

  /*
   * Proxies requires from S3 for so those requests can be authenticated
   *
   */
  proxy: function(req, res) {
    var key = req.path.slice(1);
    if ((key).slice(-1) === '/') key = key + 'index.html';

    var object = s3.getObject({
          Bucket: sails.config.build.s3Bucket,
          Key: key
        }).on('httpHeaders', function(statusCode, headers) {
          res.set(headers);
        }),
        stream = object.createReadStream().on('error', function(error) {
          var file = key.split('/').pop().indexOf('.') !== -1,
              notFound = error.statusCode === 404;
          if (!file && notFound) return res.redirect(req.path + '/');
          res.send(error.statusCode, error.message);
        }).pipe(res);
  }

};
