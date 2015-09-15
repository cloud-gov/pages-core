var fs = require('fs'),
    http = require('http'),
    https = require('https'),
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

// Increase sockets to avoid S3 sync errors
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 20;

// Work around upload bug for files > 1mb
AWS.util.update(AWS.S3.prototype, {
  addExpect100Continue: function addExpect100Continue(req) {}
});

module.exports = function(config, done) {

  config.compress = 'html|css|js|json|svg';

  // Loop through all files and selectively encode them
  walk(config.directory, function(err, files, directories) {
    if (err) return done(err);

    directories = directories.map(function(dir) {
      return dir.replace(config.directory + '/', '');
    });

    async.each(files, encode.bind(this, config), function(err) {
      if (err) return done(err);

      // After encoding, sync to S3
      sync(config, directories, done);
    });
  });

};

function encode(config, file, done) {
  var contentType = mime.lookup(file),
      ext = mime.extension(contentType),
      match = new RegExp(config.compress);

  if (!match.test(ext)) return done();

  fs.readFile(file, function(err, data) {
    if (err) return done(err);
    zlib.gzip(data, function(err, data) {
      if (err) return done(err);
      fs.writeFile(file, data, done);
    });
  });
}

function sync(config, directories, done) {
  var params = {
        localDir: config.directory,
        deleteRemoved: true,
        s3Params: {
          Prefix: config.prefix || '',
          CacheControl: 'max-age=60'
        },
        getS3Params: setEncoding
      },
      uploader = s3Ext.uploadDir(params);

  uploader.on('error', logError);
  uploader.on('end', setRedirects);

  function setEncoding(file, stat, done) {
    var s3Params = {},
        contentType = mime.lookup(file),
        ext = mime.extension(contentType),
        match = new RegExp(config.compress);
    if (match.test(ext)) s3Params.ContentEncoding = 'gzip';
    sails.log.verbose('syncing file: ', file);
    done(null, s3Params);
  }

  function logError(err) {
    sails.log.error('unable to sync:', err.stack);
  }

  function setRedirects() {
    var queue = async.queue(redirect, 20);
    queue.drain = done;
    queue.push(directories);
  }

  function redirect(directory, next) {
    s3.putObject({
      CacheControl: params.s3Params.CacheControl,
      Key: params.s3Params.Prefix + '/' + directory,
      WebsiteRedirectLocation: config.baseurl + '/' + directory + '/'
    }, next);
  }

}

function walk(dir, done) {
  var files = [],
      directories = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, files, directories);
    list.forEach(function(path) {
      var file = dir + '/' + path;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          directories.push(file);
          walk(file, function(err, newFiles, newDirectories) {
            files = files.concat(newFiles);
            directories = directories.concat(newDirectories);
            if (!--pending) done(null, files, directories);
          });
        } else {
          files.push(file);
          if (!--pending) done(null, files, directories);
        }
      });
    });
  });
}
