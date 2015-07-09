var Backbone = require('backbone');
var _ = require('underscore');
var $ = window.jQuery = window.$ = Backbone.$;

var MainContainerView = require('./views/MainContainerView');
var NavbarView = require('./views/NavbarView');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var dispatcher = _.clone(Backbone.Events);

var Router = Backbone.Router.extend({
  initialize: function () {
    this.sites = new SiteCollection();
    this.user = window.u = new UserModel();

    this.navbarView = new NavbarView({ model: this.user });
    this.app = new MainContainerView({ user: this.user, collection: this.sites });

  },
  routes: {
    '': 'home',
    'new': 'new',
    'edit(/)*path': 'edit'
  },
  home: function () {
    this.app.home();
    return this;
  },
  new: function () {
    this.app.new();
    return this;
  },
  edit: function (path) {
    this.app.edit(path);
    return this;
  }
});

var router = window.r = new Router();
Backbone.history.start();
