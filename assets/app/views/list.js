var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var SiteModel = require('../models/Site').model;
var listTemplateHtml = fs.readFileSync(__dirname + '/../templates/list.html').toString();
var listItemTemplateHtml = fs.readFileSync(__dirname + '/../templates/list-item.html').toString();

var SiteListView = Backbone.View.extend({
  tagName: 'div',
  className: 'list',
  template: _.template(listTemplateHtml),
  initialize: function initializeSiteListView(opts) {
    this.listenTo(this.collection, 'change', this.render);
    this.listenTo(this.collection, 'update', this.render);
    return this;
  },
  render: function renderSiteListView(opts) {
    var html,
        sitesCount = this.collection.length;

    html = this.template({
      sitesCount: sitesCount
    });
    this.$el.html(html);

    if (sitesCount > 0) {
      var $list = this.$('ul');
      $list.empty();

      this.collection.each(function(model) {
        var site = new SiteListItemView({model: model});
        $list.append(site.$el);
      }, this);
    }

    return this;
  }
});

var SiteListItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'sites-list-item',
  model: SiteModel,
  template: _.template(listItemTemplateHtml),
  initialize: function initializeSiteView() {
    this.render();
  },
  render: function renderSiteView() {
    var data = this.model.toJSON(),
        lastBuild = _(data.builds).chain().where({
          branch: data.defaultBranch
        }).filter(function(build) {
          return build.completedAt;
        }).last().value();
    data.lastBuildTime = lastBuild ? moment(new Date(lastBuild.completedAt))
      .format('L LT') : '';
    data.viewLink = data.domain ||
      data.siteRoot + '/site/' + data.owner + '/' + data.repository + '/';
    data.statusLabel = !lastBuild ? '<span class="usa-label label-warning">Publishing...</span>' :
      lastBuild.state === 'error' ? '<span class="usa-label label-danger">Error: see log for more information</span>' :
      lastBuild.state === 'success' ? '<span class="usa-label label-success">Published</span>' :
      lastBuild.state === 'skipped' ? '<span class="usa-label label-success">Published</span>' :
      '<span class="usa-label label-warning">Publishing...</span>';
    this.$el.html(this.template(data));

    this.$el.attr('data-site-id', data.id);
  }
});

module.exports = SiteListView;
