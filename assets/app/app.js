console.log('yo from up top');

var UserModel = require('./models/User');
var user = new UserModel();

var SiteListView = require('./views/SiteListView');
var SiteCollection = require('./models/Site').collection;

var sites = new SiteCollection();
var listView = new SiteListView({collection: sites})

sites.on('add', function(e) {
  listView.render();
});
sites.on('destroy', function(e) {
  listView.render();
});

window.u = user;
window.l = listView;
