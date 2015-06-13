var Backbone = require('backbone');
var _ = require('underscore');
var $ = window.jQuery = window.$ = Backbone.$;

var AddSiteView = require('./views/AddSiteView');
var UserModel = require('./models/User');
var UserView = require('./views/UserView');
var SiteListView = require('./views/SiteListView');
var SiteCollection = require('./models/Site').collection;

var dispatcher = _.clone(Backbone.Events);

var user = new UserModel();
var loginView = new UserView({model: user});
var newSiteView = new AddSiteView({user: user});
var sites = new SiteCollection();
var listView = new SiteListView({collection: sites});

listView.render({authenticated: user.isAuthenticated()});

dispatcher.listenTo(user, 'change', function() {
  renderListView();
  renderNewView();
});

dispatcher.listenTo(sites, 'change', function () {
  renderListView();
});

dispatcher.listenTo(newSiteView, 'success', function () {
  listView.collection.fetch();
})

dispatcher.listenTo(listView, 'newsite', function () {
  newSiteView.toggleDisplay();
});

function renderListView() {
  listView.render({authenticated: user.isAuthenticated()});
}

function renderNewView() {
  newSiteView.render({user: user});
}

window.d = dispatcher;
window.u = user;
window.l = listView;
window.v = newSiteView;
