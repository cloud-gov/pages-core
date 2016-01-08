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
    'submit .new-site-form': 'onTemplateSelection',
    'click [data-action=name-site]': 'showNewSiteForm'
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
    e.preventDefault();
    var data = $(e.target).parents('.template-block').data('template');
    // initialize GitHub Model
    // call github.clone()
    // handle errors
  },
  showNewSiteForm: function showNewSiteForm(e) {
    var $form = $('.new-site-form', $(e.target).parents('.template-block'));
    var state = $form.attr('aria-hidden') === 'true';
    $('.new-site-form').attr('aria-hidden', 'true');
    if (state) {
      $form.attr('aria-hidden', 'false');
      $('[name="site-name"]', $(e.target).parents('.template-block')).focus();
    }
  },
  onSuccess: function onSuccess(e) {
    this.collection.add(e);
    this.trigger('site:save:success');
  },
  onError: function onError(e) {
    var message = (e && e.responseJSON && e.responseJSON.raw) ?
          e.responseJSON.raw : e.responseText;
    $('.alert-container').html(
      '<div class="usa-grid"><div class="usa-alert usa-alert-error new-site-error" role="alert">' +
        message +
      '</div></div>'
    )[0].scrollIntoView();
    this.trigger('site:save:failure');
  }
});

module.exports = AddSiteView;
