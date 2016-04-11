var fs = require('fs');

var _ = require('underscore');
var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/main.html').toString();

var SiteSettingsView = require('./settings');
var SiteLogsView = require('./logs');
var EditorContainerView = require('./pages/pages');

var SiteView = Backbone.View.extend({
  template: _.template(templateHtml),
  initialize: function (opts) {
    this.render();
  },
  render: function () {
    var html = this.template(this.model.toJSON());
    this.$el.html(html);
    this.registerPageSwitcher();
  },
  registerPageSwitcher: function () {
    var $el = this.$('#pages-container');
    this.pageSwitcher = new ViewSwitcher($el[0], {
      show: function(view) {
        document.body.scrollTop = 0;
      }
    });
  },
  update: function (childView, activeSel) {
    this.pageSwitcher.set(childView);
    this.setSidenavActive(activeSel);
  },
  setSidenavActive: function (sel) {
    this.$('.site-actions li').removeClass('active');
    this.$(sel).parent('li').addClass('active');
  },
  showPages: function (branch, file) {
    var editView = new EditorContainerView({
      owner: this.model.get('owner'),
      repo: this.model.get('repository'),
      branch: branch || this.model.get('defaultBranch'),
      file: file,
      site: this.model
    });
    this.update(editView, '.icon-pages');
    return this;
  },
  showSettings: function () {
    var siteSettingsView = new SiteSettingsView({ model: this.model });
    this.update(siteSettingsView, '.icon-settings');
    this.listenToOnce(siteSettingsView, 'site:save:success', this.onSettingSaveSuccess);
    return this;
  },
  showLogs: function(id) {
    var siteLogsView = new SiteLogsView({ model: this.model });
    this.update(siteLogsView, '.icon-logs');
    return this;
  },
  onSettingSaveSuccess: function (e) {
    var url = ['#site', this.model.get('id')].join('/');
    federalist.navigate(url, { trigger: true });
  }
});

module.exports = SiteView;
