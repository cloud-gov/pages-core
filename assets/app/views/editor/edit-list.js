var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/list-item.html').toString();

var EditorFileListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'list-group',
  template: _.template(templateHtml),
  initialize: function initializeEditorFileListView(opts) {
    this.path = opts.path;
    this.files = opts.files || [];
  },
  render: function renderUserView() {
    var self        = this,
        owner       = this.path.owner,
        repo        = this.path.repo,
        branch      = this.path.branch;

    if (this.files.length === 0) {
      self.$el.append('<strong>No files in this folder</strong>');
      return this;
    }

    this.files.forEach(function(file) {
      var newHash = ['#edit', owner, repo, branch, file.path].join('/'),
          type    = (file.type == 'dir') ? 'glyphicon-folder-close' : 'glyphicon-file',
          fileExt = file.name.split('.').slice(-1)[0],
          ghExts = ['html', 'css', 'scss', 'js'];

      if (_.contains(ghExts, fileExt) && type != 'folder') {
        newHash = ['https://github.com/', owner, repo, 'edit', branch, file.path].join('/');
      }
      self.$el.append(self.template({ fileUrl: newHash,
        fileName: file.name,
        type: type
      }));
    });

    return this;
  }
});

module.exports = EditorFileListView;
