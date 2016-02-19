var Backbone = require('backbone');
var _ = require('underscore');
window.jQuery = window.$ = Backbone.$;

var MainContainerView = require('./views/main');
var NavbarView = require('./views/nav');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var encodeB64 = require('./helpers/encoding').encodeB64;

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
      window.localStorage.setItem('token', encodeB64(token));
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
      Backbone.history.start();
    });

  },
  routes: {
    '': 'home',
    'new': 'newSite',
    'edit/:owner/:repo/:branch(/)*file': 'edit',
    'site/:id/settings': 'editSite',
    'site/:id/logs': 'builds'
  },
  home: function () {
    this.mainView.home();
    return this;
  },
  newSite: function () {
    this.mainView.newSite();
    return this;
  },
  edit: function (owner, repo, branch, file) {
    this.mainView.edit(owner, repo, branch, file);
    return this;
  },
  editSite: function(id) {
    this.mainView.editSite(id);
    return this;
  },
  builds: function(id) {
    this.mainView.builds(id);
    return this;
  }
});

window.federalist = new Router();
window.federalist.dispatcher = _.clone(Backbone.Events);
