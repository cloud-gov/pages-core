var Backbone = require('backbone');
var _ = require('underscore');
//<span class="glyphicon glyphicon-<%- type %>" aria-hidden="true" style="padding-right:.3em;"></span>
var html = _.template('<li><a href="<%- link %>"><%- text %></a></li>');

var BreadcrumbView = Backbone.View.extend({
  initialize: function(opts) {
    var opts = opts || {};

    if (!opts.model) throw new Error('');

    if (opts.$el) {
      this.$el = opts.$el;
      this.el = opts.$el[0];
    }

    this.model.on('change', this.render.bind(this));

    return this;
  },
  render: function () {
    var self    = this,
        model   = this.model,
        owner   = this.model.get('owner'),
        repo    = this.model.get('repoName'),
        branch  = this.model.get('branch'),
        file    = this.model.get('file'),
        filePath;

    this.$el.empty();

    this.$el.append(html({
      text: owner,
      link: '/',
      type: 'home'
    }));

    this.$el.append(html({
      text: repo,
      link: ['#edit', owner, repo, branch].join('/'),
      type: 'folder-close'
    }));

    if (!file) return this;

    filePath = file.split('/');
    filePath.forEach(function(file, i) {
      var repoHref = [owner, repo, branch].join('/');
      var fileHref = filePath.slice(0, i + 1).join('/');
      var link = ['#edit', repoHref, fileHref].join('/');
      self.$el.append(html({ text: file, link: link, type: ''}));
    })
    return this;
  }
});

module.exports = BreadcrumbView;
