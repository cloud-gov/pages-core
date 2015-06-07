var Backbone = require('backbone');

var SiteModel = Backbone.Model.extend({
  defaults: {
    'builds': [],
    'repository': 'Repo goes here',
    'engine': 'jekyll',
    'branch': 'master'
  },
  urlRoot: '/v0/site'
});

var SiteCollection = Backbone.Collection.extend({
  model: SiteModel,
  url: '/v0/site',

  initialize: function() {
    this.fetch();
  }
});

module.exports.model = SiteModel;
module.exports.collection = SiteCollection;
