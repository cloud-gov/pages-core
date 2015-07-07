var Backbone = require('backbone');
var _ = require('underscore');
var $ = window.jQuery = window.$ = Backbone.$;

var MainContainerView = require('./views/MainContainerView');
var AuthenticateView = require('./views/AuthenticateView');
var AddSiteView = require('./views/AddSiteView');
var UserView = require('./views/UserView');
var SiteListView = require('./views/SiteListView');
var EditView = require('./views/EditView');

var UserModel = require('./models/User');
var SiteCollection = require('./models/Site').collection;

var dispatcher = _.clone(Backbone.Events);

dispatcher.listenTo(sites, 'change', function () {
  router.navigate('', { trigger: true });
});

var Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'new': 'new',
    'edit/*path': 'edit'
  },
  home: function () {
    var authed = true; //user.isAuthenticated();
    console.log('authed', authed);
    if (authed) {
      var listView = new SiteListView({collection: sites});
      appView.pageSwitcher.set(listView);
    }
    else {
      var authView = new AuthenticateView();
      appView.pageSwitcher.set(authView);
    }
  },
  new: function () {
    var addSiteView = new AddSiteView({ user: user });
    appView.pageSwitcher.set(addSiteView);
  },
  edit: function (path) {
    console.log('editoring for', path);
    var editView = new EditView({ path: path });
    appView.pageSwitcher.set(editView);
  }
});

var user = new UserModel();
var sites = new SiteCollection();

var router = new Router();
var appView = new MainContainerView({ user: user });
var navbarView = new UserView({ model: user });

Backbone.history.start();
