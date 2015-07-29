var fs = require('fs');

var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('underscore');
var encodeB64 = window.btoa;
var decodeB64 = window.atob;

var EditorFileListView = require('./EditorFileListView');
var EditorView = require('./EditorView');

var templateHtml = fs.readFileSync(__dirname + '/../templates/EditTemplate.html').toString();

var EditView = Backbone.View.extend({
  tagName: 'div',
  template: _.template(templateHtml),
  initialize: function (opts) {
    this.path = opts.path || false;
    this.token = getToken();
    return this;
  },
  render: function () {
    var self        = this,
        owner       = this.path.owner,
        repo        = this.path.repo,
        branch      = this.path.branch,
        file        = this.path.file,
        ghBaseUrl   = 'https://api-github-com-gwqynjms41pa.runscope.net/repos',
        ghUrl       = [ghBaseUrl, owner, repo, 'contents'].join('/'),
        params      = { access_token: this.token, ref: branch },
        html, editorConfig;

    this.$el.html(this.template());
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.$('#edit-content')[0]);

    if (!this.path) return this;
    if (file) ghUrl += '/' + file;

    $.ajax(ghUrl, {
      data: params,
      complete: function (res) {
        if (res.status !== 200) return;
        var json = res.responseJSON;
        self.updateCurrentPath([owner, repo, file].join('/'));
        if (json.type === 'file') {
          // if Github's API tells us this is a file, use the editor
          var editorView = new EditorView({
            content: decodeB64(json.content)
          });
          self.listenTo(editorView, 'edit:save', function (save) {
            $.ajax(ghUrl, {
              method: 'PUT',
              headers: {
                'Authorization': 'token ' + self.token,
                'Content-Type': 'application/json'
              },
              data: JSON.stringify({
                path: file,
                message: save.msg || 'Attempted commit',
                content: encodeB64(save.md),
                sha: json.sha,
                branch: branch
              }),
              complete: function (res) {
                console.log('res', res);
              }
            });
          });
          self.pageSwitcher.set(editorView);
        }
        else {
          // otherwise it is a directory, so display the file listing
          var fileListView = new EditorFileListView({
            path: self.path,
            files: json
          });
          self.pageSwitcher.set(fileListView);
        }
      }
    });

    return this;
  },
  updateCurrentPath: function (pathText) {
    this.$('#edit-current-path').text(pathText);
    return this;
  }
});

function getToken() {
  var t = {};
  document.cookie.split('; ').forEach(function(i) {
    var s     = i.split('='),
        key   = s[0],
        value = s[1];

    t[key] = value;
  });

  return decodeB64(t.token);
}

module.exports = EditView;
