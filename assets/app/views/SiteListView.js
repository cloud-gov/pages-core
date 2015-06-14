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
    'click .add-site-action': 'triggerNewSite'
  },
  initialize: function initializeSiteListView() {
    this.listenTo(this.collection, 'sync', this.render);

    return this;
  },
  render: function renderSiteListView(opts) {
    var authenticated,
        html,
        sitesCount = this.collection.length;

    if (!this.authenticated) {
      authenticated = opts.authenticated || false;
      this.authenticated = authenticated;
    }
    html = this.template({ authenticated: this.authenticated , sitesCount: sitesCount});
    this.$el.html(html);

    if (sitesCount > 0) {
      var $list = this.$('ul');
      $list.empty();

      this.collection.each(function(model) {
        var site = new SiteListItemView({model: model});
        $list.append(site.$el);
      }, this);
    }

    return this;
  },
  triggerNewSite: function triggerNewSite() {
    this.trigger('newsite');
  }
});

module.exports = SiteListView;
