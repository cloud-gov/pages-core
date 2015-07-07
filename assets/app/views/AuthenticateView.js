var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../templates/AuthenticateTemplate.html').toString();

var AuthenticateView = Backbone.View.extend({
  tagName: 'div',
  template: _.template(templateHtml),
  initialize: function initializeUserView() {
  },
  render: function renderUserView() {
    this.$el.html(this.template());

    return this;
  }
});

module.exports = AuthenticateView;
