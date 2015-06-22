var Backbone = require('backbone');
var _ = require('underscore');

var siteUrl = '/v0/site';

var SiteModel = Backbone.Model.extend({
  defaults: {
    'builds': [],
    'users': [],
    'repository': 'Repo goes here',
    'engine': 'jekyll',
    'branch': 'master'
  },
  urlRoot: siteUrl,
  initialize: function() {
    this.set('builds', _.where(this.collection.builds, { site: this.id }));
  }
});

var SiteCollection = Backbone.Collection.extend({
  model: SiteModel,
  url: siteUrl,

  initialize: function() {
    var collection = this;
    $.getJSON('/v0/build', function(builds) {
      collection.builds = builds;
      collection.fetch();
    });
  }
});

module.exports.model = SiteModel;
module.exports.collection = SiteCollection;
