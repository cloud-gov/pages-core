var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var SiteModel = require('../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../templates/AddSiteTemplate.html').toString();

var AddSiteView = Backbone.View.extend({
  tagName: 'div',
  className: 'add-site',
  events: {
    'click .submit': 'onSubmit',
  },
  initialize: function initializeSiteView() {
    this.render();
  },
  render: function renderSiteView() {
    this.$el.html(templateHtml);
  },
  onSubmit: function onSubmit() {
    var data = {};
    this.$('form').serializeArray().map(function(d) {
      data[d.name] = d.value;
    });
    var newSite = new SiteModel();
    newSite.save(data, {success: this.onSuccess.bind(this), error: this.onError.bind(this)});
  },
  onSuccess: function onSuccess() {
    console.log('winning');
    this.$el.html('yay! new site');
    this.trigger('success');
  },
  onError: function onError() {
    console.log('failing');
    this.$el.html('oh noes!');
  }
});


module.exports = AddSiteView;
