var Backbone = require('backbone');
var _ = require('underscore');
window.jQuery = window.$ = Backbone.$;

var MainContainerView = require('./views/main');
var NavbarView = require('./views/nav');
var AddSiteView = require('./views/add');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var encodingHelpers = require('./helpers/encoding');

var Router = Backbone.Router.extend({
  initialize: function () {
    var self = this;
    this.user = new UserModel();

    if (window.localStorage.getItem('token')) {
      $('#home').hide();
      $('#main-loader').show();
    }

    this.listenToOnce(this.user, 'sync', function (user) {
      var token = self.user.attributes.passports[0].tokens.accessToken;
      window.localStorage.setItem('token', encodingHelpers.encodeB64(token));
      self.sites = new SiteCollection();
      self.sites.fetch({
        data: $.param({ limit: 50 }),
        success: function (sites) {
          self.navbarView = new NavbarView({ model: self.user });
          self.mainView = new MainContainerView({
            user: self.user,
            collection: self.sites
          });
          self.navbarView.render();
          Backbone.history.start();
        }
      });
    });

    this.listenToOnce(this.user, 'error', function (error) {
      window.localStorage.setItem('token', '');
      window.location.hash = '#';
      self.mainView = new MainContainerView({user: self.user});
      Backbone.history.start();
    });

  },
  routes: {
    '': 'dashboard',
    'new': 'newSite',
    'site/:id(/)': 'sitePages',
    'site/:id/edit/:branch(/)*file': 'sitePages',
    'site/:id/settings': 'siteSettings',
    'site/:id/logs': 'siteLogs'
  },
  dashboard: function () {
    this.mainView.dashboard();
    return this;
  },
  newSite: function () {
    var addSiteView = new AddSiteView({
      user: this.user,
      collection: this.sites
    });
    this.mainView.pageSwitcher.set(addSiteView);
    this.listenToOnce(addSiteView, 'site:save:success', this.onAddSiteSuccess);
    return this;
  },
  sitePages: function (id, branch, file) {
    this.mainView.sitePages(id, branch, file);
    return this;
  },
  siteSettings: function(id) {
    this.mainView.siteSettings(id);
    return this;
  },
  siteLogs: function(id) {
    this.mainView.siteLogs(id);
    return this;
  },
  onAddSiteSuccess: function (e) {
    this.dashboard();
  }
});

window.federalist = new Router();
window.federalist.dispatcher = _.clone(Backbone.Events);
window.federalist.helpers = {
  encoding: encodingHelpers
};
