var AWS = require('aws-sdk'),
    s3 = new AWS.S3();

module.exports = {

  /*
   * Proxies requests so they can be authenticated
   */
  proxy: function(req, res, next) {

    // If not using S3, pass through to static asset middleware
    if (!sails.config.build.s3Bucket) return next();

    // For S3, proxy requests from S3 bucket
    var key = req.path.slice(1);
    if ((key).slice(-1) === '/') key = key + 'index.html';

    var object = s3.getObject({
          Bucket: sails.config.build.s3Bucket,
          Key: key
        }).on('httpHeaders', function(statusCode, headers) {
          var redirect = headers['x-amz-website-redirect-location'] ||
            headers['X-Amz-Website-Redirect-Location'];
          if (redirect) return res.redirect(redirect);
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
