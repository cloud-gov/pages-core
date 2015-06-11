var Backbone = require('backbone');
var $ = window.jQuery = window.$ = Backbone.$;

var UserModel = require('./models/User');
var UserView = require('./views/UserView');
var SiteListView = require('./views/SiteListView');
var SiteCollection = require('./models/Site').collection;

var user = new UserModel();
var loginView = new UserView({model: user});

var sites = new SiteCollection();
var listView = new SiteListView({collection: sites, user: user});

listView.render();

sites.on('add', function(e) {
  listView.render();
});
sites.on('destroy', function(e) {
  listView.render();
});

window.u = user;
window.l = listView;
window.v = loginView;
