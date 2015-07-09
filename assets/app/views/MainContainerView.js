var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');

var AuthenticateView = require('./AuthenticateView');
var SiteListView = require('./SiteListView');
var AddSiteView = require('./AddSiteView');
var EditView = require('./EditView');

var AppView = Backbone.View.extend({
  el: 'main',
  initialize: function (opts) {
    this.user = opts.user;
    this.sites = opts.collection;

    this.render();
  },
  render: function () {
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.el);
  },
  home: function () {
    var authed = this.user.isAuthenticated();
    if(authed) {
      var listView = new SiteListView({ collection: this.sites });
      this.pageSwitcher.set(listView);

      return this;
    }

    var authenticateView = new AuthenticateView();
    this.pageSwitcher.set(authenticateView);
    return this;
  },
  new: function () {
    var addSiteView = new AddSiteView({ user: this.user });
    this.pageSwitcher.set(addSiteView);

    this.listenToOnce(addSiteView, 'site:save:success', function () {
      this.home();
    }.bind(this));

    return this;
  },
  edit: function (path) {
    console.log('editoring for', path);

    var editView = new EditView({ path: path });
    this.pageSwitcher.set(editView);

    return this;
  }
});

module.exports = AppView;
