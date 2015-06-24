/// <reference path="../../typings/node/node.d.ts"/>

var exec = require('child_process').exec;
var path = require('path');
var isWindows = /^win/.test(process.platform);

/**
 * A service to managing build processes. Each engine gets its own method,
 * which takes a model, runs a shell process, and then returns the model
 * and any error message.
 * 
 * NOTE: On Windows, run commands should include a check for directory
 * existence prior to RMDIR execution but IF EXIST statements don't concatenate
 * in one line with '&&' which results in 'The system cannot find the path specified' error.
 */

module.exports = {
  jekyll: function(model, done) {

    // Run command template based on OS
    if (isWindows) {
      this._run([
        'RMDIR ${source} /S /Q',
        'MKDIR ${source}',
        'git clone -b ${branch} --single-branch ' +
          'https://${token}@github.com/${owner}/${repository}.git ${source}',
        'echo baseurl: /${root}/${owner}/${repository}/${branch} > ' +
          '${source}\\_config_base.yml',
        'jekyll build --safe --config ${source}\\_config.yml,${source}\\_config_base.yml ' +
          '--source ${source} --destination ${source}\\_site',
        'RMDIR ${destination} /S /Q',
        'MKDIR ${destination}',
        'XCOPY ${source}\\_site ${destination} /E /I',
        'RMDIR ${source} /S /Q',
      ], model, done);
    } else {
      this._run([
        'rm -rf ${source}',
        'mkdir -p ${source}',
        'git clone -b ${branch} --single-branch ' +
          'https://${token}@github.com/${owner}/${repository}.git ${source}',
        'echo "baseurl: /${root}/${owner}/${repository}/${branch}" > ' +
          '${source}/_config_base.yml',
        'jekyll build --safe --config ${source}/_config.yml,${source}/_config_base.yml ' +
          '--source ${source} --destination ${source}/_site',
        'rm -rf ${destination}',
        'mkdir -p ${destination}',
        'cp -r ${source}/_site/* ${destination}',
        'rm -rf ${source}'
      ], model, done);
    }
  },

  hugo: function(model, done) {
    
    // Run command template based on OS
    if (isWindows) {
      this._run([
        'RMDIR ${source} /S /Q',
        'MKDIR ${source}',
        'git clone -b ${branch} --single-branch ' +
          'https://${token}@github.com/${owner}/${repository}.git ${source}',
        'hugo --baseUrl=/${root}/${owner}/${repository}/${branch} ' +
          '--source=${source}',
        'RMDIR ${destination} /S /Q',
        'MKDIR ${destination}',
        'XCOPY ${source}\\public ${destination} /E /I',
        'RMDIR ${source} /S /Q',
      ], model, done);
    } else {
      this._run([
        'rm -rf ${source}',
        'mkdir -p ${source}',
        'git clone -b ${branch} --single-branch ' +
          'https://${token}@github.com/${owner}/${repository}.git ${source}',
        'hugo --baseUrl=/${root}/${owner}/${repository}/${branch} ' +
          '--source=${source}',
        'rm -rf ${destination}',
        'mkdir -p ${destination}',
        'cp -r ${source}/public/* ${destination}',
        'rm -rf ${source}'
      ], model, done);
    }
  },

  static: function(model, done) {

    // Run command template based on OS
    if (isWindows) {
      this._run([
        'RMDIR ${source} /S /Q',
        'MKDIR ${source}',
        'git clone -b ${branch} --single-branch https://${token}@github.com/${owner}/${repository}.git ${source}',
        'RMDIR ${destination} /S /Q',
        'XCOPY ${source} ${destination} /E /I',
        'RMDIR ${source} /S /Q'
      ], model, done);
    } else {
      this._run([
        'rm -rf ${source}',
        'mkdir -p ${source}',
        'git clone -b ${branch} --single-branch ' +
          'https://${token}@github.com/${owner}/${repository}.git ${source}',
        'rm -rf ${destination}',
        'mkdir -p ${destination}',
        'cp -r ${source}/* ${destination}',
        'rm -rf ${source}'
      ], model, done);
    }
  },

  /*
   * Takes a command template and a model, tokenizes the model,
   * runs the command, and calls the callback.
   *
   * The following tokens are availble: owner, repository, branch,
   * token (GitHub access token), source (temporary build directory),
   * destination (final destination for build site).
   *
   * The source directory should be deleted after build completes.
   *
   * @param {Array} array of string templates, each item is a command
   * @param {Build} build model to parse
   * @param {Function} callback function
   */
  _run: function(cmd, model, done) {
    var service = this,
        defaultBranch = model.branch === model.site.defaultBranch,
        tokens = {
          branch: model.branch,
          branchURL: defaultBranch ? '' : '/' + model.branch,
          root: defaultBranch ? 'site' : 'preview'
        },
        // Temporary until workaround for single line IF EXIST logic is implemented
        template = isWindows ? _.template(cmd.join(' & ')) : _.template(cmd.join(' && '));

    // Populate user's passport
    Passport.findOne({ user: model.user.id }).exec(function(err, passport) {

      // End early if error
      if (err) return done(err, model);

      model.user.passport = passport;

      // Continue run process with populated model
      next(model);

    });

    function next(model) {

      // Set populated token values
      tokens.repository = model.site.repository;
      tokens.owner = model.site.owner;
      tokens.token = (model.user.passport) ?
        model.user.passport.tokens.accessToken : '';

      // Set up source and destination paths
      tokens.source = sails.config.build.tempDir + '/source/' +
        tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
      tokens.destination = sails.config.build.tempDir + '/destination/' +
        tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
      tokens.publish = sails.config.build.publishDir + '/' + tokens.root + '/' +
        tokens.owner + '/' + tokens.repository + tokens.branchURL;

      // Remove leading slash and normalize path for Windows
      if (isWindows) {
        tokens.source = path.normalize(tokens.source.replace(/^\//, ''));
        tokens.destination = path.normalize(tokens.destination.replace(/^\//, ''));
        tokens.publish = path.normalize(tokens.publish.replace(/^\//, ''));
      }

      // Run command in child process and
      // call callback with error and model
      exec(template(tokens), function(err, stdout, stderr) {
        if (stdout) sails.log.verbose('stdout: ' + stdout);
        if (stderr) sails.log.verbose('stderr: ' + stderr);
        if (err) return done(err, model);
        service.publish(tokens, model, done);
      });

    }

  },

  /*
   * Publish a built site by copying it to its publish directory
   * or syncing it to an S3 bucket.
   *
   * @param {Object} tokens from the _run command
   * @param {Build} build model to parse
   * @param {Function} callback function
   */
  publish: function(tokens, model, done) {

    // Switch on publish environment
    // Need to include "azure" case
    switch (Object.keys(sails.config.build)) {
      
      // If an S3 bucket is defined, sync the site to it
      case "s3Bucket":
        var syncConfig = {
            prefix: tokens.root + '/' +
              tokens.owner + '/' +
              tokens.repository +
              tokens.branchURL,
            directory: tokens.destination
          };
        sails.log.verbose('Publishing job: ', model.id,
          ' => ', sails.config.build.s3Bucket);
        S3(syncConfig, function(err) {
          done(err, model);
        });
      
      // Or else copy the site to a local directory
      default:
        var cmd;
        if (isWindows) {
          cmd = _.template([
              'RMDIR ${publish} /S /Q',
              'MKDIR ${publish}',
              'XCOPY ${destination} ${publish} /E /I'
            ].join(' & '));
        } else {
          cmd = _.template(['rm -r ${publish} || true',
              'mkdir -p ${publish}',
              'cp -r ${destination}/ ${publish}',
            ].join(' && '));
        }
        sails.log.verbose('Publishing job: ', model.id,
          ' => ', tokens.publish);
        exec(cmd(tokens), function(err, stdout, stderr) {
          if (stdout) sails.log.verbose('stdout: ' + stdout);
          if (stderr) sails.log.verbose('stderr: ' + stderr);
          done(err, model);
        });
    }

  }

};
