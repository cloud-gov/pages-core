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
  initialize: function() {
    this.fetch();
  },
  parse: function(data) {
    var userData = data[0];
    return userData;
  }
});

module.exports = UserModel;
