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

    this.user = new UserModel();

    this.listenToOnce(this.user, 'sync', function (user) {
      var token = this.user.attributes.passports[0].tokens.accessToken;
      window.localStorage.setItem('token', encodeB64(token));
      this.sites = new SiteCollection();
      this.sites.fetch({
        data: $.param({ limit: 50 }),
        success: function (sites) {
          this.navbarView = new NavbarView({ model: this.user });
          this.mainView = new MainContainerView({
            user: this.user,
            collection: this.sites
          });
          this.navbarView.render();
          Backbone.history.start();
        }.bind(this)
      });
    }.bind(this));

    this.listenToOnce(this.user, 'error', function (error) {
      window.localStorage.setItem('token', '');
      window.location.hash = '#';
      this.navbarView = new NavbarView({ model: this.user });
      this.mainView = new MainContainerView({ user: this.user });
      this.navbarView.render();
      Backbone.history.start();
    }.bind(this));

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
