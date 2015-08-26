var Backbone = require('backbone');
var _ = require('underscore');
window.jQuery = window.$ = Backbone.$;
var encodeB64 = window.btoa;
var decodeB64 = window.atob;

var MainContainerView = require('./views/main');
var NavbarView = require('./views/nav');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var Router = Backbone.Router.extend({
  initialize: function () {
    this.sites = new SiteCollection();
    this.user = new UserModel();

    this.navbarView = new NavbarView({ model: this.user });
    this.mainView = new MainContainerView({ user: this.user, collection: this.sites });

    this.listenTo(this.user, 'change', function () {
      var token = this.user.attributes.passports[0].tokens.accessToken;
      window.localStorage.setItem('token', encodeB64(token));
      Backbone.history.loadUrl();
    });
  },
  routes: {
    '': 'home',
    'new': 'new',
    'edit/:owner/:repo/:branch(/)*file': 'edit',
    'site/:id/edit': 'siteEdit',
    'site/:id/builds': 'builds'
  },
  home: function () {
    this.mainView.home();
    return this;
  },
  new: function () {
    this.mainView.new();
    return this;
  },
  edit: function (owner, repo, branch, file) {
    this.mainView.edit(owner, repo, branch, file);
    return this;
  },
  siteEdit: function(id) {
    this.mainView.siteEdit(id);
    return this;
  },
  builds: function(id) {
    this.mainView.builds(id);
    return this;
  }
});

window.federalist = new Router();
Backbone.history.start();
