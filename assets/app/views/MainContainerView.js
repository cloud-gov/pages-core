var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');

var AuthenticateView = require('./AuthenticateView');
var SiteEditView = require('./SiteEditView');
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
    federalist.navigate('');
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
    var addSiteView = new AddSiteView({
          user: this.user,
          collection: this.sites
        });
    this.pageSwitcher.set(addSiteView);

    this.listenToOnce(addSiteView, 'site:save:success', function () {
      this.home();
    }.bind(this));

    return this;
  },
  siteEdit: function(id) {
    var siteEditView = new SiteEditView({ model: this.sites.get(id) });
    this.pageSwitcher.set(siteEditView);
    this.listenToOnce(siteEditView, 'site:save:success', function () {
      this.home();
    }.bind(this));
    return this;
  },
  edit: function (path) {
    var editView = new EditView({ path: path });
    this.pageSwitcher.set(editView);

    return this;
  }
});

module.exports = AppView;
