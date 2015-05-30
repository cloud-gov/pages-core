var exec = require('child_process').exec;

/**
 * A service to managing build processes. Each engine gets its own method,
 * which takes a model, runs a shell process, and then returns the model
 * and any error message.
 */

module.exports = {

  jekyll: function(model, done) {

    // Run command template
    this._run([
      'rm -rf ${source}',
      'mkdir -p ${source}',
      'git clone -b ${branch} --single-branch ' +
        'https://${token}@github.com/${owner}/${repository}.git ${source}',
      'echo "baseurl: /${owner}/${repository}" > ${source}/_config_base.yml',
      'jekyll build --config ${source}/_config.yml,${source}/_config_base.yml ' +
        '--source ${source} --destination ${source}/_site',
      'rm -rf ${destination}',
      'mkdir -p ${destination}',
      'cp -r ${source}/_site/* ${destination}',
      'rm -rf ${source}'
    ], model, done);

  },

  hugo: function(model, done) {

    // TODO: test hugo build
    this._run([
      'rm -rf ${source}',
      'mkdir -p ${source}',
      'git clone -b ${branch} --single-branch ' +
        'https://${token}@github.com/${owner}/${repository}.git ${source}',
      'hugo --baseUrl=/${owner}/${repository} ' +
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

    var tokens = { branch: model.branch },
        template = _.template(cmd.join(' && '));

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
      tokens.token = model.user.passport.tokens.accessToken;

      // Set up source and destination paths
      tokens.source = sails.config.build.sourceRoot + '/' +
        tokens.owner + '/' + tokens.repository + '/' + tokens.branch;

      // TODO: Set up destination outside of .tmp for persistence
      // TODO: Figure out routing for main branch vs previews
      //       (if branch === default branch...)
      tokens.destination = sails.config.build.destinationRoot + '/' +
        tokens.owner + '/' + tokens.repository + '/' + tokens.branch;

      // Run command in child process and
      // call callback with error and model
      exec(template(tokens), function(err) {
        done(err, model);
      });

    }

  }

};
