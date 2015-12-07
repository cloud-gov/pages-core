var fs = require('fs');

var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('underscore');

var decodeB64 = require('./../../helpers/encoding').decodeB64;

var BreadcrumbView = require('./breadcrumb');
var FileListView = require('./files');
var PagesView = require('./pages');
var EditorView = require('./edit-file');

var Github = require('./../../models/Github');

var template = _.template(fs.readFileSync(__dirname + '/../../templates/editor/main.html').toString());

var EditView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click #add-page': 'newPage',
    'click #save-page': 'savePage'
  },
  initialize: function (opts) {
    if (!opts) return this;
    var html = template({ owner: opts.owner, repo: opts.repo });

    this.$el.html(html);
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.$('#edit-content')[0]);

    this.model = window.federalist.github = new Github({
      token: getToken(),
      owner: opts.owner,
      repoName: opts.repo,
      branch: opts.branch,
      file: opts.file,
      site: opts.site
    });

    this.breadcrumb = new BreadcrumbView({
      $el: this.$('ol.breadcrumb'),
      model: this.model
    });

    this.model.on('sync', this.update.bind(this));

    window.federalist.dispatcher.on('github:upload:selected', this.uploadAsset.bind(this));

    return this;
  },
  update: function () {
    var model = this.model,
        config = model.configFiles || {},
        childView, pages;

    this.$('#edit-button').empty();

    if (model.get('type') === 'file') {
      var saveButton = $('<a class="btn btn-primary pull-right" id="save-page" href="#" role="button">Save this page</a>');
      this.$('#edit-button').append(saveButton);
      childView = new EditorView({ model: model });
    }
    else {
      var editButton = $('<a class="btn btn-primary pull-right" id="add-page" href="#" role="button">Add a new page</a>');
      this.$('#edit-button').append(editButton);
      if (config['_navigation.json'] && config['_navigation.json'].present) {
        pages = config['_navigation.json'].json;
        childView = new PagesView({ model: model, pages: pages });
      }
      else {
        childView = new FileListView({ model: model });
      }
    }

    this.pageSwitcher.set(childView);

    return this;
  },
  savePage: function (e) {
    e.preventDefault();
    this.pageSwitcher.current.trigger('click:save');
  },
  newPage: function(e) {
    var self = this,
        path = prompt('Please the new file path', 'pages/thing.md'),
        opts = {
          path: path
        };

    e.preventDefault();

    this.listenToOnce(this.model, 'github:commit:success', function(m){
      var owner = self.model.get('owner'),
          repoName  = self.model.get('repoName'),
          branch = self.model.get('branch'),
          url = ['#edit', owner, repoName, branch, m.request.path].join('/');

      Backbone.history.loadUrl(url, { trigger: true });
    });

    this.model.addPage(opts);
  },
  uploadAsset: function (e) {
    var self = this,
        fileReader = new FileReader();

    fileReader.onload = function () {
      var r = /data:\w+\/\w+;base64,/,
          path = [self.model.uploadDir, e.name].join('/'),
          commit = {
            path: path,
            message: 'Uploading ' + e.name,
            base64: fileReader.result.replace(r, '')
          };

      self.model.commit(commit);
    }

    fileReader.readAsDataURL(e);
  }
});

function getToken() {
  var token = window.localStorage.getItem('token') || false;
  if (!token) return false;
  return decodeB64(token);
}

module.exports = EditView;
