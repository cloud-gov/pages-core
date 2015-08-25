var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

//var templateHtml = fs.readFileSync(__dirname + '../../templates/authenticate.html').toString();

var EditorFileListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'collection',
  template: _.template('<li class="collection-item avatar"><a href="<%- fileUrl %>"><i class="material-icons circle"><%- type %></i><p class="title"><%- fileName %></p></a></li>'),
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
          type    = (file.type == 'dir') ? 'folder' : 'insert_drive_file',
          li      = self.template({ fileUrl: newHash, fileName: file.name, type: type });

      self.$el.append(li);
    });

    return this;
  }
});

module.exports = EditorFileListView;
