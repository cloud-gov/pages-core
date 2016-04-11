var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../../../templates/site/pages/page-list-item.html').toString();

var NavBuilderView = Backbone.View.extend({
  tagName: 'ul',
  className: 'list-group',
  template: _.template(templateHtml),
  initialize: function (opts) {
    opts  = opts || {};
    this.pages = opts.pages;

    if (!this.pages) throw new Error('Supply pages');

    return this;
  },
  render: function () {
    var self = this;
    this.pages.forEach(function(page) {
      self.addToList(self.$el, { text: page.title, href: page.href });

      if (page.children) {
        var ul = $('<ul class="list-group"></ul>');
        page.children.forEach(function(childPage) {
          self.addToList(ul, { text: childPage.title, href: childPage.href });
        });
        self.$el.append($('<li class="list-group-item"></li>').append(ul));
      }
    });

    return this;
  },
  createListItemHtml: function (item) {
    var siteId = this.model.site.id;
    var branch = this.model.get('branch');
    var href = ['#site', siteId, 'edit', branch, item.href].join('/');

    return this.template({
      text: item.text,
      href: href,
      draft: _.contains(this.model.get('drafts'), item.href)
    });
  },
  addToList: function (list, item) {
    var html = this.createListItemHtml(item);
    list.append(html);
  }
});

module.exports = NavBuilderView;
