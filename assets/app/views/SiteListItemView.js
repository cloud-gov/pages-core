var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var SiteModel = require('../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../templates/SiteListItemTemplate.html').toString();

var SiteListItemView = Backbone.View.extend({
  tagName: 'li',
  model: SiteModel,
  template: _.template(templateHtml),
  events: {
    'click a.delete': 'onDelete'
  },
  initialize: function initializeSiteView() {
    this.render();
  },
  render: function renderSiteView() {
    var data = this.model.toJSON(),
        lastBuildTime = new Date(_(data.builds).chain().where({
          branch: data.defaultBranch
        }).filter(function(build) {
          return build.completedAt;
        }).last().value().completedAt);
    data.lastBuildTime = moment(lastBuildTime).format('L LT');
    this.$el.html(this.template(data));
  },

  onDelete: function onDelete() {
    var opts = {
      succes: this.onDeleteSuccess.bind(this),
      error: this.onDeleteError.bind(this)
    };
    this.model.destroy(opts);
  },
  onDeleteSuccess: function onDeleteSuccess() {
    console.log('delete success');
  },
  onDeleteError: function onDeleteError() {
    console.log('delete failure');
  }
});

module.exports = SiteListItemView;
