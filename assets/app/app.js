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

    this.sites = new SiteCollection();
    this.user = new UserModel();

    this.navbarView = new NavbarView({ model: this.user });
    this.mainView = new MainContainerView({ user: this.user, collection: this.sites });

    this.listenToOnce(this.user, 'change', function () {
      var token = this.user.attributes.passports[0].tokens.accessToken;
      window.localStorage.setItem('token', encodeB64(token));
      self.navbarView.render();
      Backbone.history.loadUrl();
    });
  },
  routes: {
    '': 'home',
    'new': 'newSite',
    'edit/:owner/:repo/:branch(/)*file': 'edit',
    'site/:id/edit': 'editSite',
    'site/:id/builds': 'builds'
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
Backbone.history.start();
