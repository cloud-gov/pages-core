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
    'click a[type=submit]': 'onSubmitGithubRepo',
    'click [data-action=fork-template]': 'onTemplateSelection'
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
    $.ajax('/v0/user/add-site', {
      method: 'POST',
      data: data,
      success: this.onSuccess.bind(this),
      error: this.onError.bind(this)
    });
  },
  onTemplateSelection: function onTemplateSelection(e) {
    var templateId = $(e.target).parents('.template-block').data('template');
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
    this.trigger('site:save:success');
  },
  onError: function onError(e) {
    var message = (e && e.responseJSON && e.responseJSON.raw) ?
          e.responseJSON.raw : e.responseText;
    $('.alert-container').html(
      '<div class="alert alert-danger new-site-error" role="alert">' +
        message +
      '</div>'
    )[0].scrollIntoView();
    this.trigger('site:save:failure');
  }
});

module.exports = AddSiteView;
