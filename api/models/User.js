var User = {
  // Enforce model schema in the case of schemaless databases
  schema: true,

  attributes: {
    username: {
      type: 'string',
      unique: true
    },
    email: {
      type: 'email'
    },
    githubAccessToken: {
      type: 'string'
    },
    githubUserId: {
      type: 'string'
    },
    sites: {
      collection: 'site',
      via: 'users'
    },
    builds: {
      collection: 'build',
      via: 'user'
    },

    // Method to return JSON to the API
    toJSON: function() {
      var obj = this.toObject();
      obj.githubAccessToken = undefined
      obj.githubUserId = undefined
      return obj;
    }
  }
};

module.exports = User;
