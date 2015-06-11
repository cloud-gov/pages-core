var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var AddSiteView = require('./AddSiteView');
var SiteListItemView = require('./SiteListItemView');
var templateHtml = fs.readFileSync(__dirname + '/../templates/SiteListTemplate.html').toString();

var SiteListView = Backbone.View.extend({
  el: 'main',
  template: _.template(templateHtml),
  events: {
    'click .add-site': 'onAddSite'
  },
  initialize: function initializeSiteListView(opts) {
    this.user = opts.user;
    this.listenTo(this.collection, 'sync', this.render);
    this.listenTo(this.user, 'change', this.render);
  },
  render: function renderSiteListView() {
    this.$el.html(this.template({authenticated: this.user.isAuthenticated()}));
    var $list = this.$('ul');
    $list.empty();

    this.collection.each(function(model) {
      var site = new SiteListItemView({model: model});
      $list.append(site.$el);
    }, this);

    $('.collapsible').collapsible();

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
