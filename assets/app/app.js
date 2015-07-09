var Backbone = require('backbone');
var _ = require('underscore');
var $ = window.jQuery = window.$ = Backbone.$;

var MainContainerView = require('./views/MainContainerView');
var AuthenticateView = require('./views/AuthenticateView');
var SiteListView = require('./views/SiteListView');
var AddSiteView = require('./views/AddSiteView');
var UserView = require('./views/UserView');
var EditView = require('./views/EditView');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var dispatcher = _.clone(Backbone.Events);

var Router = Backbone.Router.extend({
  initialize: function () {
    this.sites = new SiteCollection();
    this.user = window.u = new UserModel();

    this.navbarView = new UserView({ model: this.user });
    this.app = new MainContainerView({ user: this.user, collection: this.sites });

    this.listenTo(this.user, 'change', function () {
      var authed = this.user.isAuthenticated();
      if(authed) {
        var listView = new SiteListView({ collection: this.sites });
        this.app.pageSwitcher.set(listView);
      }
    });
  },
  routes: {
    '': 'home',
    'new': 'new',
    'edit/*path': 'edit'
  },
  home: function () {
    var authView = new AuthenticateView();
    this.app.pageSwitcher.set(authView);
  },
  new: function () {
    var addSiteView = new AddSiteView({ user: user });
    this.app.pageSwitcher.set(addSiteView);
  },
  edit: function (path) {
    console.log('editoring for', path);
    var editView = new EditView({ path: path });
    this.app.pageSwitcher.set(editView);
  }
});

var router = window.r = new Router();

Backbone.history.start();
