var fs = require('fs'),
    zlib = require('zlib'),
    mime = require('mime'),
    AWS = require('aws-sdk'),
    S3 = require('s3'),
    s3 = new AWS.S3({ params: {
      Bucket: sails.config.build.s3Bucket
    } }),
    s3Ext = S3.createClient( {
      s3Client: s3
    });

module.exports = function(config, done) {

  var params = {
        localDir: config.directory,
        deleteRemoved: true,
        s3Params: {
          Prefix: config.prefix || '',
          CacheControl: 'max-age=60'
        },
        //getS3Params: setParams
      },
      uploader = s3Ext.uploadDir(params).on('error', function(err) {
        sails.log.error('unable to sync:', err.stack);
        done(err);
      }).on('end', function() {
        done();
      });

  config.compress = 'html|css|js|json';

  function setParams(file, stat, callback) {
    var s3Params = {},
        contentType = mime.lookup(file),
        extension = mime.extension(contentType);

    if (config.cache) s3Params.CacheControl = config.cache;

    if ((new RegExp(config.compress)).test(extension)) {
      var gzip = zlib.createGzip(),
          inp = fs.createReadStream(file),
          out = fs.createWriteStream(file);

      s3Params.ContentEncoding = 'gzip';
      console.log(s3Params);
      out.on('finish', function() {
        callback(null, s3Params);
      });
      inp.pipe(gzip).pipe(out);

    } else {
      console.log(s3Params);
      callback(null, s3Params);
    }

  }

};
