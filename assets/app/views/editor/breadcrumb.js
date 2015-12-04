var Backbone = require('backbone');
var _ = require('underscore');

var html = _.template('<li> <% if (link) { %> <a href="<%- link %>"><% } %> <%- text %> <% if (link) { %> </a> <% } %></li>');

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
        type    = (this.model.configFiles['_navigation.json'].present) ? 'pages' : 'files',
        filePath;

    console.log('type', type);

    this.$el.empty();

    if (!file) return this;

    if (type === 'files') {
      this.$el.addClass('files');
      this.$el.append(html({
        text: 'All files',
        link: ['#edit', owner, repo, branch].join('/')
      }));

      filePath = file.split('/');
      filePath.forEach(function(file, i) {
        var repoHref = [owner, repo, branch].join('/');
        var fileHref = filePath.slice(0, i + 1).join('/');
        var link = ['#edit', repoHref, fileHref].join('/');
        self.$el.append(html({ text: file, link: link }));
      });
    }
    else {
      this.$el.append(html({
        text: 'All pages',
        link: ['#edit', owner, repo, branch].join('/')
      }));
    }
    return this;
  }
});

module.exports = BreadcrumbView;
