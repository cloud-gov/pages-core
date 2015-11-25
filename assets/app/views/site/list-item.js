var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var SiteModel = require('../../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/list-item.html').toString();

var SiteListItemView = Backbone.View.extend({
  tagName: 'li',
  model: SiteModel,
  template: _.template(templateHtml),
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
  }
});

module.exports = SiteListItemView;
