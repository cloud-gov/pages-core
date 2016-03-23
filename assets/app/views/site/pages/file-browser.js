var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../../../templates/site/pages/file-list-item.html').toString();

var FileBrowserView = Backbone.View.extend({
  tagName: 'ul',
  className: 'list-group',
  initialize: function (opts) {
    this.files = this.model.attributes.json;

    return this;
  },
  render: function () {
    var self    = this,
        model   = this.model;

    this.$el.empty();

    if (this.files && this.files.length === 0) {
      this.$el.append('<strong>No files in this folder</strong>');
      return this;
    }

    this.files.forEach(function(file) {
      var html = self.link(file);
      self.$el.append(html);
    });

    return this;
  },
  link: function (file, opts) {
    opts    = opts || {};
    var id = this.model.site.id;
    var owner = this.model.get('owner');
    var repo = this.model.get('repoName');
    var branch  = this.model.get('branch'),
        newHash = ['#site', id, 'edit', branch, file.path].join('/'),
        type    = file.type,
        fileExt = file.name.split('.').slice(-1)[0],
        ghExts  = ['html', 'css', 'scss', 'js', 'json'];

    if (opts.type) type = opts.type;
    if (_.contains(ghExts, fileExt) && type != 'folder') {
      newHash = ['https://github.com/', owner, repo, 'edit', branch, file.path].join('/');
    }

    return _.template(templateHtml)({ fileUrl: newHash,
      fileName: file.name,
      type: type
    });
  }
});

module.exports = FileBrowserView;
