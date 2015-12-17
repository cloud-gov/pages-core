var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../templates/home.html').toString();

var secureSvg = fs.readFileSync(__dirname + '/../../images/secure.svg').toString();
var maintainSvg = fs.readFileSync(__dirname + '/../../images/maintain.svg').toString();
var customSvg = fs.readFileSync(__dirname + '/../../images/custom.svg').toString();

var AuthenticateView = Backbone.View.extend({
  tagName: 'div',
  template: _.template(templateHtml),
  initialize: function initializeUserView() {
    return this;
  },
  render: function renderUserView() {
    this.$el.html(this.template());

    this.$('#secure-svg').html(secureSvg);
    this.$('#maintain-svg').html(maintainSvg);
    this.$('#custom-svg').html(customSvg);

    return this;
  }
});

module.exports = AuthenticateView;
