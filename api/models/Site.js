/**
* Site.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  // Enforce model schema in the case of schemaless databases
  schema: true,

  attributes: {
    owner: {
      type:'string',
      required: true
    },
    repository: {
      type:'string',
      required: true
    },
    engine: {
      type: 'string',
      defaultsTo: 'static',
      enum: ['jekyll', 'hugo', 'static']
    },
    defaultBranch: {
      type: 'string',
      defaultsTo: 'master'
    },
    users: {
      collection: 'user',
      via: 'sites'
    },
    builds: {
      collection: 'build',
      via: 'site'
    },
    toJSON: function() {
      var obj = this.toObject(),
          config = sails.config.build || {};
      // Add siteRoot to the API response for previews
      obj.siteRoot = config.s3Bucket ? 'http://' + config.s3Bucket +
        '.s3-website-us-east-1.amazonaws.com': '';
      return obj;
    }
  },

  beforeCreate: function(values, done) {
    this.registerSite(values, done);
  },

  afterCreate: function(model, done) {
    Site.findOne({id: model.id }).populate('users')
        .exec(function(err, site) {
          if (err) return done(err);
          var build = {
              user: site.users[0].id,
              site: model.id,
              branch: model.defaultBranch
          };
          Build.create(build, done);
        });
  },

  registerSite: function(values, done) {
    async.parallel({
      // Set up GitHub webhook
      hook: GitHub.setWebhook.bind(this, values, values.users[0])
    }, function(err, res) {
      // Ignore error if hook already exists; otherwise, return error
      if (err) {
        var ghErr, hookMessage = 'Hook already exists on this repository';
        try { ghErr = JSON.parse(err.message).errors[0].message; } catch(e) {}
        if (ghErr === hookMessage) return done();
        if (JSON.parse(err.message)) return done(JSON.parse(err.message));
        return done(err);
      }
      done();
    });
  }
};
