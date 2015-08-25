var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

/* this require looks gross but it enables us to have one place
to set template data that is available to the front and back end apps */
var SiteTemplates = require('../../../../config/templates').templates;

var SiteModel = require('../../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/add.html').toString();

var AddSiteView = Backbone.View.extend({
  tagName: 'div',
  className: 'form',
  template: _.template(templateHtml),
  events: {
    'submit': 'onSubmitGithubRepo',
    'click .card-action .btn': 'onTemplateSelection'
  },
  initialize: function initializeSiteView(opts) {
    this.user = opts.user;
  },
  render: function renderAddSiteView() {
    var html = this.template({user: this.user.toJSON(), siteTemplates: SiteTemplates });
    this.$el.html(html);
  },
  onSubmitGithubRepo: function onSubmitGithubRepo(e) {
    e.preventDefault();
    var data = {};
    this.$('form').serializeArray().map(function(d) {
      if (d.name === 'users') d.value = [+d.value];
      data[d.name] = d.value;
    });

    console.log('data', data);

    new SiteModel(data, { collection: this.collection }).save(null, {
      success: this.onSuccess.bind(this),
      error: this.onError.bind(this)
    });
  },
  onTemplateSelection: function onTemplateSelection(e) {
    var templateId = $(e.target).parents('.col').attr('data-template');
    var data = { templateId: templateId };
    $.ajax('/v0/site/fork', {
      method: 'POST',
      data: data,
      success: this.onSuccess.bind(this),
      error: this.onError.bind(this)
    });
  },
  onSuccess: function onSuccess(e) {
    this.collection.add(e);
    console.log('winning', e);
    this.trigger('site:save:success');
  },
  onError: function onError(e) {
    console.log('failing', e);
    this.trigger('site:save:failure');
  }
});

module.exports = AddSiteView;
