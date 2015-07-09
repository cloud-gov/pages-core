var Backbone = require('backbone');
var ViewSwitcher = require('ampersand-view-switcher');

var AppView = Backbone.View.extend({
  el: 'main',
  initialize: function (opts) {
    this.render();
  },
  render: function () {
    this.pageContainer = this.el;
    this.pageSwitcher = new ViewSwitcher(this.pageContainer);
  }
});

module.exports = AppView;
