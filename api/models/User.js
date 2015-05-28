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
    passports: {
      collection: 'Passport',
      via: 'user'
    },
    sites: { collection: 'site',
      via: 'users'
    },
    builds: {
      collection: 'build',
      via: 'user'
    }
  }
};

module.exports = User;
