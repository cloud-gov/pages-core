var exec = require('child_process').exec;

/**
 * A hook to managing build processes. Each engine gets its own method,
 * which takes a model, runs a shell process, and then returns the model
 * and any error message.
 */

var hook = {

  jekyll: function(model, done) {

    // Run command template
    this._run([
      'rm -rf ${source}',
      'mkdir -p ${source}',
      'git clone -b ${branch} --single-branch ' +
        'https://${token}@github.com/${owner}/${repository}.git ${source}',
      'echo "baseurl: ${baseurl}\nbranch: ${branch}\n${config}" > ' +
        '${source}/_config_base.yml',
      'bundle exec jekyll build --safe --config ${source}/_config.yml,${source}/_config_base.yml ' +
        '--source ${source} --destination ${source}/_site',
      'rm -rf ${destination}',
      'mkdir -p ${destination}',
      'cp -r ${source}/_site/* ${destination}',
      'rm -rf ${source}'
    ], model, done);

  },

  hugo: function(model, done) {

    // Run command template
    this._run([
      'rm -rf ${source}',
      'mkdir -p ${source}',
      'git clone -b ${branch} --single-branch ' +
        'https://${token}@github.com/${owner}/${repository}.git ${source}',
      'hugo --baseUrl=${baseurl} ' +
        '--source=${source}',
      'rm -rf ${destination}',
      'mkdir -p ${destination}',
      'cp -r ${source}/public/* ${destination}',
      'rm -rf ${source}'
    ], model, done);

  },

  static: function(model, done) {

    // Run command template
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
          root: defaultBranch ? 'site' : 'preview',
          config: model.site.config
        },
        template = _.template(cmd.join(' && '));

    // Continue run process with populated model
    next(model);

    function next(model) {

      // Set populated token values
      tokens.repository = model.site.repository;
      tokens.owner = model.site.owner;
      tokens.token = (model.user.passport) ?
        model.user.passport.tokens.accessToken : '';
      tokens.baseurl = (model.site.domain && defaultBranch) ? "''" :
        '/' + tokens.root + '/' + tokens.owner +
        '/' + tokens.repository + tokens.branchURL;

      // Set up source and destination paths
      tokens.source = sails.config.build.tempDir + '/source/' +
        tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
      tokens.destination = sails.config.build.tempDir + '/destination/' +
        tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
      tokens.publish = sails.config.build.publishDir + '/' + tokens.root + '/' +
        tokens.owner + '/' + tokens.repository + tokens.branchURL;

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

    // If an S3 bucket is defined, sync the site to it
    if (sails.config.build.s3Bucket) {
      var syncConfig = {
            prefix: tokens.root + '/' +
              tokens.owner + '/' +
              tokens.repository +
              tokens.branchURL,
            directory: tokens.destination,
            baseurl: tokens.baseurl === "''" ? '' : tokens.baseurl
          };
      sails.log.verbose('Publishing job: ', model.id,
        ' => ', sails.config.build.s3Bucket);
      S3(syncConfig, function(err) {
        var cmd = _.template('rm -r ${destination} || true');
        exec(cmd(tokens), function(err, stdout, stderr) {
          if (stdout) sails.log.verbose('stdout: ' + stdout);
          if (stderr) sails.log.verbose('stderr: ' + stderr);
          done(err, model);
        });
      });

    // Or else copy the site to a local directory
    } else {
      var cmd = _.template(['rm -r ${publish} || true',
            'mkdir -p ${publish}',
            'cp -r ${destination}/* ${publish}',
            'rm -r ${destination} || true'
          ].join(' && '));
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

module.exports = function(sails) {
  _.extend(this, hook);
  return this;
};
