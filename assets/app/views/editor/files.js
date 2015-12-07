var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/file-list-item.html').toString();

var FileListView = Backbone.View.extend({
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
    var opts    = opts || {},
        owner   = this.model.get('owner'),
        repo    = this.model.get('repoName'),
        branch  = this.model.get('branch'),
        newHash = ['#edit', owner, repo, branch, file.path].join('/'),
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

module.exports = FileListView;
