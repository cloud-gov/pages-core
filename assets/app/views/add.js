var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

/* this require looks gross but it enables us to have one place
to set template data that is available to the front and back end apps */
var SiteTemplates = require('../../../config/templates').templates;

var SiteModel = require('../models/Site').model;
var Github = require('../models/Github');

var templateHtml = fs.readFileSync(__dirname + '/../templates/add.html').toString();

var decodeB64 = require('../helpers/encoding').decodeB64;

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
    var repo = $('[name="site-name"]', e.target).val();

    // Make repo name safe for github
    repo = repo
      .replace(/[^\w\.]+/g, '-')
      .replace(/^-+/g, '')
      .replace(/-+$/g, '');
    $('[name="site-name"]', e.target).val(repo);

    this.github = new Github({
      token: getToken(),
      owner: data.owner,
      repoName: data.repo,
      branch: data.branch
    }).clone({
      owner: data.owner,
      repository: data.repo
    }, {
      repository: repo
    }, function(err, model) {
      if (err) return this.onError(err);
      this.onSuccess(model);
    }.bind(this));
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
    this.trigger('site:save:success');
  },
  errorMessage: function (e) {
    var message;
    if (e && e.responseJSON && e.responseJSON.raw) message = e.responseJSON.raw;
    else if (e && e.responseJSON) message = e.responseJSON;
    else message = e.responseText;

    if (message && message.errors && message.errors.length > 0) {
      message = 'We encountered an error while making your website: ' + _.chain(message.errors).pluck('message').compact().value().join(', ');
    }
    return message;
  },
  onError: function onError(e) {
    var message = this.errorMessage(e);
    $('.alert-container').html(
      '<div class="usa-grid"><div class="usa-alert usa-alert-error new-site-error" role="alert">' +
        message +
      '</div></div>'
    )[0].scrollIntoView();
    this.trigger('site:save:failure');
  }
});

module.exports = AddSiteView;

function getToken() {
  var token = window.localStorage.getItem('token') || false;
  if (!token) return false;
  return decodeB64(token);
}
