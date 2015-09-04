var fs = require('fs');

var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('underscore');

var encodeB64 = function (s) {
  return window.btoa(unescape(encodeURIComponent(s)));
};
var decodeB64 = function (s) {
  return decodeURIComponent(escape(window.atob(s)));
};

var EditorFileListView = require('./edit-list');
var EditorView = require('./edit-file');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/main.html').toString();
var breadcrumbHtml = '<li><a href="<%- link %>"><%- text %></a></li>';

var EditView = Backbone.View.extend({
  tagName: 'div',
  template: _.template(templateHtml),
  initialize: function (opts) {
    this.path = opts.path || false;
    this.token = getToken();
    this.$el.html(this.template());
    return this;
  },
  render: function () {
    var self        = this,
        owner       = this.path.owner,
        repo        = this.path.repo,
        branch      = this.path.branch,
        file        = this.path.file,
        ghExts      = ['html', 'css', 'scss', 'js'],
        ghBaseUrl   = 'https://api.github.com/repos',
        ghUrl       = [ghBaseUrl, owner, repo, 'contents'].join('/'),
        params      = { access_token: this.token, ref: branch, z: parseInt(Math.random() * 10000) },
        html, editorConfig;

    this.ghUrl = ghUrl;
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.$('#edit-content')[0]);

    if (!this.path) return this;

    if (file) {
      this.path.fileExt = file.split('.').slice(-1)[0];
      ghUrl += '/' + file;
    }

    $.ajax(ghUrl, {
      data: params,
      complete: function (res) {
        if (res.status !== 200) return;
        var json = res.responseJSON;
        self.updateCurrentPath(owner, repo, file);
        if (json.type === 'file') {
          // if Github's API tells us this is a file, use the editor
          var editorView = new EditorView({
            path: self.path,
            content: decodeB64(json.content)
          });
          self.path.sha = json.sha;
          self.listenTo(editorView, 'edit:save', self.saveFile);
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
  updateCurrentPath: function (owner, repo, file) {
    var bcEl     = this.$('ol.breadcrumb'),
        template = _.template(breadcrumbHtml),
        branch   = this.path.branch,
        filePath;
    bcEl.empty();
    bcEl.append(template({ text: owner, link: '/' }));
    bcEl.append(template({ text: repo, link: ['#edit', owner, repo, branch].join('/') }));

    if (!file) return this;

    filePath = file.split('/');
    filePath.forEach(function(file, i) {
      var repoHref = [owner, repo, branch].join('/');
      var fileHref = filePath.slice(0, i + 1).join('/');
      var link = ['#edit', repoHref, fileHref].join('/');
      bcEl.append(template({ text: file, link: link }));
    })

    return this;
  },
  saveFile: function (save) {
    var self = this,
        ghUrl = self.ghUrl + '/' + self.path.file;

    $.ajax(ghUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + self.token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        path: self.path.file,
        message: save.msg,
        content: encodeB64(save.md),
        sha: self.path.sha,
        branch: self.path.branch
      }),
      complete: function (res) {
        var json = res.responseJSON;
        var responseText = {
          0:   'The internet is not connected. Please check your connection.',
          200: 'Yay, the save was successful!',
          404: 'Whoops, looks like this page can not be found.',
          409: 'Uh oh, there was a conflict when saving'
        };
        if (res.status === 200) {
          $('#save-status-result').removeClass('label-danger');
          $('#save-status-result').addClass('label-success');
        }
        else {
          $('#save-status-result').removeClass('label-success');
          $('#save-status-result').addClass('label-danger');
        }
        $('#save-status-result').text(responseText[res.status]);

        if (res.status === 200) {
          self.path.sha = json.content.sha;
          setTimeout(function() {
            $('#save-status-result').text('');
          }, 3000);
        }
      }
    });
  }
});

function getToken() {
  var token = window.localStorage.getItem('token') || false;
  if (!token) return false;
  return decodeB64(token);
}

module.exports = EditView;
