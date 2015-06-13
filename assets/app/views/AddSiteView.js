var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var SiteModel = require('../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../templates/AddSiteTemplate.html').toString();

var AddSiteView = Backbone.View.extend({
  el: 'div.form',
  template: _.template(templateHtml),
  events: {
    'click #submit': 'onSubmit'
  },
  initialize: function initializeSiteView(opts) {
    this.user = opts.user;
    this.listenTo(this.user, 'change', this.render);
  },
  render: function renderSiteView() {
    this.$el.html(this.template(this.user.toJSON()));
  },
  toggleDisplay: function toggleDisplay(e) {
    this.$el.toggleClass('show');
  },
  onSubmit: function onSubmit() {
    var data = {};
    this.$('form').serializeArray().map(function(d) {
      data[d.name] = d.value;
    });

    console.log('data', data);

    var newSite = new SiteModel();
    newSite.save(data, {
      success: this.onSuccess.bind(this),
      error: this.onError.bind(this)
    });
  },
  onSuccess: function onSuccess() {
    console.log('winning');
    this.toggleDisplay();
    this.trigger('success');
  },
  onError: function onError() {
    console.log('failing');
    this.trigger('failure');
  }
});


module.exports = AddSiteView;
