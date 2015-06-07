var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var AddSiteView = require('./AddSiteView');
var SiteListItemView = require('./SiteListItemView');

var SiteListView = Backbone.View.extend({
  el: '#site-listing',
  events: {
    'click #new-site': 'onAddSite'
  },
  initialize: function initializeSiteListView() {
    this.listenTo(this.collection, 'sync', this.render);
  },
  render: function renderSiteListView() {
    var $list = this.$('ul');
    $list.empty();

    this.collection.each(function(model) {
      var site = new SiteListItemView({model: model});
      $list.append(site.$el);
    }, this);

    return this;
  },
  onAddSite: function onAddSite() {
    var addView = new AddSiteView();

    addView.on('success', function() {
      this.collection.fetch();
      setTimeout(function() { addView.remove(); }, 2000);
    }, this);

    this.$el.prepend(addView.$el);
  }
});

module.exports = SiteListView;
