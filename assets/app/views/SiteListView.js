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
    'click .add-site-action': 'toggleAddSiteView'
  },
  initialize: function initializeSiteListView(opts) {
    this.user = opts.user;

    this.listenTo(this.collection, 'sync', this.render);
    this.listenTo(this.user, 'change', this.render);

    this.views = {
      addView: new AddSiteView()
    };

    this.views.addView.on('success', function() {
      this.collection.fetch();
    }, this);
  },
  render: function renderSiteListView() {
    this.$el.html(this.template({authenticated: this.user.isAuthenticated()}));
    this.$el.prepend(this.views.addView.$el);

    var $list = this.$('ul');
    $list.empty();

    this.collection.each(function(model) {
      var site = new SiteListItemView({model: model});
      $list.append(site.$el);
    }, this);

    $('.collapsible').collapsible();

    return this;
  },
  toggleAddSiteView: function toggleAddSiteView() {
    this.views.addView.$el.toggleClass('show');
    return this;
  }
});

module.exports = SiteListView;
