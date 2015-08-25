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
  events: {
    'click [data-action=delete-site]': 'onDelete'
  },
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
    this.$el.html(this.template(data));
  },

  onDelete: function onDelete() {
    var opts = {
      succes: this.onDeleteSuccess.bind(this),
      error: this.onDeleteError.bind(this)
    };
    if (window.confirm('Are you sure you want to delete this site?')) {
      this.model.destroy(opts);
    }
  },
  onDeleteSuccess: function onDeleteSuccess() {
    console.log('delete success');
  },
  onDeleteError: function onDeleteError() {
    console.log('delete failure');
  }
});

module.exports = SiteListItemView;
