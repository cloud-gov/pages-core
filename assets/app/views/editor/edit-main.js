var fs = require('fs');

var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('underscore');

var BreadcrumbView = require('./breadcrumb');
var FileListView = require('./files');
var PagesView = require('./pages');
var EditorView = require('./edit-file');

var Github = require('./../../models/Github');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/main.html').toString();

var EditView = Backbone.View.extend({
  tagName: 'div',
  initialize: function (opts) {
    if (!opts) return this;

    this.$el.html(_.template(templateHtml));
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.$('#edit-content')[0]);

    this.model = new Github({
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

    return this;
  },
  update: function () {
    var model = this.model,
        config = model.configFiles || {},
        childView, pages;

    if (model.get('type') === 'file') {
      childView = new EditorView({ model: model });
    }
    else {
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
  }
});

function getToken() {
  var token = window.localStorage.getItem('token') || false;
  if (!token) return false;
  return decodeB64(token);
}

module.exports = EditView;
