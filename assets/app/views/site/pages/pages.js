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

var templateHtml = fs.readFileSync(__dirname + '/../../../templates/site/pages/pages.html').toString();

var EditView = Backbone.View.extend({
  tagName: 'div',
  template: _.template(templateHtml),
  events: {
    'click #add-page': 'newPage',
    'click #save-page': 'savePage'
  },
  initialize: function (opts) {
    if (!opts) return this;

    this.model = window.federalist.github = this.initializeModel(opts);

    this.model.on('sync', this.update.bind(this));

    window.federalist.dispatcher.on('github:upload:selected', this.uploadAsset.bind(this));

    return this;
  },
  initializeModel: function (opts) {
    var model = new Github({
      token: getToken(),
      owner: opts.owner,
      repoName: opts.repo,
      branch: opts.branch,
      file: opts.file,
      site: opts.site
    });

    return model;
  },
  initializeBreadcrumbView: function (sel, model) {
    return new BreadcrumbView({
      $el: this.$(sel),
      model: this.model
    });
  },
  update: function () {
    var model = this.model,
        config = model.configFiles || {},
        childView;

    this.model.set('isDraft', _.contains(
      this.model.get('drafts'),
      this.model.get('file'))
    );

    if (model.get('isDraft')) {
      this.redirectToDraft(model);
    }

    var html = this.template(this.getTemplateData(model));
    this.$el.html(html);

    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.$('#edit-content')[0]);
    this.breadcrumb = this.initializeBreadcrumbView('ol.breadcrumb', this.model);
    this.breadcrumb.render();

    childView = this.getChildView(model);
    this.pageSwitcher.set(childView);

    return this;
  },
  getChildView: function (model) {
    var config = model.configFiles || {};
    if (model.get('type') === 'file') {
      return new EditorView({ model: model });
    }

    if (config['_navigation.json'] && config['_navigation.json'].present) {
      pages = config['_navigation.json'].json;
      return new NavBuilderView({ model: model, pages: pages });
    }
    else {
      return new FileBrowserView({ model: model });
    }
  },
  getTemplateData: function (model) {
    return {
      id: model.site.id,
      owner: model.get('owner'),
      repository: model.get('repoName'),
      draft: model.get('isDraft'),
      file: model.get('file'),
      branch: model.get('branch')
    };
  },
  savePage: function (e) {
    e.preventDefault();
    this.pageSwitcher.current.trigger('click:save');
  },
  newPage: function(e) {
    e.preventDefault();
    var editView = new EditorView({ model: this.model , isNewPage: true });

    this.pageSwitcher.set(editView);
  },
  redirectToDraft: function (model) {
    var draftBranch = '_draft-' + encodeB64(model.file);
    var url = ['#site', model.site.id, 'edit', draftBranch, model.file].join('/');

    if (url !== '#' + Backbone.history.getFragment()) {
      return federalist.navigate(url, { trigger: true });
    }
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
