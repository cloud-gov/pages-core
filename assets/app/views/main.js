var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');
var querystring = require('querystring');

var SiteListView = require('./list');
var SiteView = require('./site/site');
var HomeView = require('./home');

var MainView = Backbone.View.extend({
  el: 'main',
  initialize: function (opts) {
    opts = (typeof opts === 'object' && opts) || {};

    this.user = opts.user;
    this.sites = opts.collection;

    // Initiate websocket subscription and fetch sites on build message
    io.socket.get('/v0/build?limit=0');
    io.socket.on('build', function() {
      this.sites.fetch({
        data: $.param({ limit: 50 }),
        success: function() {}
      });
    }.bind(this));

    this.render();
  },
  render: function () {
    this.$el.empty();
    this.pageSwitcher = this.pageSwitcher || new ViewSwitcher(this.el, {
      show: function(view) {
        document.body.scrollTop = 0;
      }
    });
  },
  clearAlerts: function () {
    $('.alert-container').html('');
  },
  setAlert: function (text) {
    var newAlert = $('<div/>', {
      class: 'usa-alert usa-alert-error',
      role: 'alert'
    });

    $('.alert-container').html(
      newAlert.html('<div class="usa-alert-body">' + text + '</div>')
    );
  },
  parseDashboardErrorFromURL: function (url) {
    var messages = {
      'Error.Passport.Unauthorized': 'Your account is not set up to access Federalist. Have you signed up as a beta user? If you have signed up and should have access, please let us know. You can reach us in our public chat room: https://chat.18f.gov/?channel=federalist-public',
      'preview.login': 'Please log in to preview this site',
      'default': 'An unexpected error occured. Please try again. If you continue to see this message, please let us know. You can reach us in our public chat room: https://chat.18f.gov/?channel=federalist-public'
    };
    var error = querystring.parse(url.search.slice(1)).error;
    var message = error && (messages[error] || messages['default']);

    return message;
  },
  dashboard: function () {
    var error = this.parseDashboardErrorFromURL(window.location);

    federalist.navigate('');
    this.clearAlerts();

    if(this.user.isAuthenticated()) {
      var listView = new SiteListView({ collection: this.sites });
      this.pageSwitcher.set(listView);

      return this;
    }

    // Show alert message
    if (error) this.setAlert(error);

    this.pageSwitcher.set(new HomeView());

    return this;
  },
  getOrCreateSiteView: function (id) {
    var view = this.siteView;
    if (view && view.model && view.model.id === parseInt(id)) return view;

    this.siteView = new SiteView({ model: this.sites.get(id) });
    return this.siteView;
  },
  sitePages: function (id, branch, file) {
    var siteView = this.getOrCreateSiteView(id);
    this.pageSwitcher.set(siteView);
    siteView.showPages(branch, file);
    return this;
  },
  siteEditContent: function (id, branch, file) {
    var siteView = this.getOrCreateSiteView(id);
    this.pageSwitcher.set(siteView);
    siteView.showPages(branch, file);
    return this;
  },
  siteSettings: function(id) {
    var siteView = this.getOrCreateSiteView(id);
    this.pageSwitcher.set(siteView);
    siteView.showSettings();
    return this;
  },
  siteLogs: function(id) {
    var siteView = this.getOrCreateSiteView(id);
    this.pageSwitcher.set(siteView);
    siteView.showLogs();
    return this;
  }
});

module.exports = MainView;
