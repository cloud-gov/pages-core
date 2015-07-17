var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var UserModel = require('../models/User');
var templateHtml = fs.readFileSync(__dirname + '/../templates/NavbarTemplate.html').toString();

var NavbarView = Backbone.View.extend({
  el: '.user',
  template: _.template(templateHtml),
  initialize: function initializeUserView() {
    this.listenTo(this.model, 'change', this.render);
    this.render();

    return this;
  },
  render: function renderUserView() {
    var user = this.model.toJSON();
    this.$el.html(this.template(user));

    return this;
  }
});

module.exports = NavbarView;
