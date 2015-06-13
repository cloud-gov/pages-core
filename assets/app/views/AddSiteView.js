var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

/* this bit require looks gross but it enables us to have one place
to set template data that is available to the front and back end apps */
var SiteTemplates = require('../../../config/templates');

var SiteModel = require('../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../templates/AddSiteTemplate.html').toString();

var AddSiteView = Backbone.View.extend({
  el: 'div.form',
  template: _.template(templateHtml),
  events: {
    'click #submit': 'onSubmitGithubRepo',
    'click .cancel-add-action': 'toggleDisplay',
    'click .card-action .btn': 'onTemplateSelection'
  },
  initialize: function initializeSiteView(opts) {
    this.user = opts.user;
    this.listenTo(this.user, 'change', this.render);
  },
  render: function renderSiteView() {
    var html = this.template({user: this.user.toJSON(), templates: SiteTemplates });
    this.$el.html(html);
  },
  toggleDisplay: function toggleDisplay(e) {
    this.$el.toggleClass('show');
  },
  onSubmitGithubRepo: function onSubmitGithubRepo() {
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
  },
  onTemplateSelection: function onTemplateSelection(e) {
    var templateId = $(e.target).parents('.col').attr('data-template');
    console.log('we will do something with', templateId);
  }
});


module.exports = AddSiteView;
