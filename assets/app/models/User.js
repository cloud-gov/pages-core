var Backbone = require('backbone');

var UserModel = Backbone.Model.extend({
  url: '/v0/user',
  defaults: {
    'username': undefined,
    'email': undefined,
    'id': undefined,
    'passports': [],
    'sites': [],
    'builds': []
  },
  initialize: function () {
    this.fetch();
  },
  isAuthenticated: function isAuthenticated() {
    if (this.get('id') !== undefined) {
      return true;
    }
    return false;
  }
});

module.exports = UserModel;
