var fs = require('fs');

var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('underscore');

var encodeB64 = require('../../../helpers/encoding').encodeB64;
var decodeB64 = require('../../../helpers/encoding').decodeB64;

var BreadcrumbView = require('./breadcrumb');
var FileBrowserView = require('./file-browser');
var NavBuilderView = require('./nav-builder');
var EditorView = require('./editor/editor');

var Github = require('../../../models/Github');

var template = _.template(fs.readFileSync(__dirname + '/../../../templates/editor/main.html').toString());

var EditView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click #add-page': 'newPage',
    'click #save-page': 'savePage'
  },
  initialize: function (opts) {
    if (!opts) return this;

    this.model = window.federalist.github = new Github({
      token: getToken(),
      owner: opts.owner,
      repoName: opts.repo,
      branch: opts.branch,
      file: opts.file,
      site: opts.site
    });

    this.model.on('sync', this.update.bind(this));

    window.federalist.dispatcher.on('github:upload:selected', this.uploadAsset.bind(this));

    return this;
  },
  update: function () {
    var model = this.model,
        config = model.configFiles || {},
        childView, pages;

    model.set('isDraft', _.contains(
      this.model.get('drafts'),
      this.model.get('file'))
    );

    if (model.get('isDraft')) {
      var draftBranch = '_draft-' + encodeB64(model.file);
      var url = [
        '#edit', model.owner, model.name, draftBranch, model.file
      ].join('/');

      if (url !== '#' + Backbone.history.getFragment()) return federalist.navigate([
        '#edit', model.owner, model.name, draftBranch, model.file
      ].join('/'), { trigger: true });
    }

    var html = template({
      owner: model.get('owner'),
      repo: model.get('repoName'),
      draft: model.get('isDraft'),
      file: model.get('file'),
      branch: model.get('branch')
    });

    this.$el.html(html);
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.$('#edit-content')[0]);
    this.breadcrumb = new BreadcrumbView({
      $el: this.$('ol.breadcrumb'),
      model: this.model
    }).render();



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
        childView = new NavBuilderView({ model: model, pages: pages });
      }
      else {
        childView = new FileBrowserView({ model: model });
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
    e.preventDefault();e.stopPropagation();
    var editView = new EditorView({ model: this.model , isNewPage: true });

    this.pageSwitcher.set(editView);
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
    };

    fileReader.readAsDataURL(e);
  }
});

function getToken() {
  var token = window.localStorage.getItem('token') || false;
  if (!token) return false;
  return decodeB64(token);
}

module.exports = EditView;
