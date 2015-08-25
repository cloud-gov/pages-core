var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var SiteListItemView = require('./list-item');
var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/list.html').toString();

var SiteListView = Backbone.View.extend({
  tagName: 'div',
  className: 'list',
  template: _.template(templateHtml),
  initialize: function initializeSiteListView(opts) {
    this.listenTo(this.collection, 'update', this.render);
    return this;
  },
  render: function renderSiteListView(opts) {
    var html,
        sitesCount = this.collection.length;

    html = this.template({
      sitesCount: sitesCount
    });
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
  }
});

module.exports = SiteListView;
