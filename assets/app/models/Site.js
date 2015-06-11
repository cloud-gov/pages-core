var Backbone = require('backbone');

var siteUrl = '/v0/site';

var SiteModel = Backbone.Model.extend({
  defaults: {
    'builds': [],
    'repository': 'Repo goes here',
    'engine': 'jekyll',
    'branch': 'master'
  },
  urlRoot: siteUrl
});

var SiteCollection = Backbone.Collection.extend({
  model: SiteModel,
  url: siteUrl,

  initialize: function() {
    this.fetch();
  }
});

module.exports.model = SiteModel;
module.exports.collection = SiteCollection;
