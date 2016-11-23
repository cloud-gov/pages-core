var AWS = require('aws-sdk')

var s3Config = sails.config.s3
var S3 = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
})

module.exports = {

  /*
   * Proxies requests so they can be authenticated
   */
  proxy: function(req, res, next) {
    // Proxy requests from S3 bucket
    var key = req.path.slice(1);
    if ((key).slice(-1) === '/') key = key + 'index.html';

    var object = S3.getObject({
      Bucket: s3Config.bucket,
      Key: key
    }).on('httpHeaders', function(statusCode, headers) {
      var redirect = headers['x-amz-website-redirect-location'] ||
        headers['X-Amz-Website-Redirect-Location'];
      if (redirect) return res.redirect(redirect);
      res.set(headers);
    })

    stream = object.createReadStream().on('error', function(error) {
      var file = key.split('/').pop().indexOf('.') !== -1,
          notFound = error.statusCode === 404;
      if (!file && notFound) return res.redirect(req.path + '/');
      res.send(error.statusCode, error.message);
    }).pipe(res);
  }
};
