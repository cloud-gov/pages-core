var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var SiteModel = require('../models/Site').model;
var templateHtml = fs.readFileSync(__dirname + '/../templates/SiteListItemTemplate.html').toString();

var SiteListItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'site',
  model: SiteModel,
  template: _.template(templateHtml),
  events: {
    'click a.delete': 'onDelete'
  },
  initialize: function initializeSiteView() {
    this.render();
  },
  render: function renderSiteView() {
    var html = this.template(this.model.toJSON());
    this.$el.html(html);
  },

  onDelete: function onDelete() {
    this.model.destroy({succes: this.onDeleteSuccess.bind(this), error: this.onDeleteError.bind(this)});
  },
  onDeleteSuccess: function onDeleteSuccess() {
    console.log('delete success');
  },
  onDeleteError: function onDeleteError() {
    console.log('delete failure');
  }
});

module.exports = SiteListItemView;
