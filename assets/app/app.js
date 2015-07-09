var Backbone = require('backbone');
var _ = require('underscore');
var $ = window.jQuery = window.$ = Backbone.$;

var MainContainerView = require('./views/MainContainerView');
var NavbarView = require('./views/NavbarView');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var Router = Backbone.Router.extend({
  initialize: function () {
    this.sites = new SiteCollection();
    this.user = window.u = new UserModel();

    this.navbarView = new NavbarView({ model: this.user });
    this.mainView = new MainContainerView({ user: this.user, collection: this.sites });

    this.listenTo(this.user, 'change', function () {
      Backbone.history.loadUrl();
    });
  },
  routes: {
    '': 'home',
    'new': 'new',
    'edit(/)*path': 'edit'
  },
  home: function () {
    this.mainView.home();
    return this;
  },
  new: function () {
    this.mainView.new();
    return this;
  },
  edit: function (path) {
    this.mainView.edit(path);
    return this;
  }
});

window.federalist = new Router();
Backbone.history.start();
