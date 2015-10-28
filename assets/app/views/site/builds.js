var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/builds.html').toString();

var BuildsView = Backbone.View.extend({
  tagName: 'div',
  className: 'list',
  template: _.template(templateHtml, { variable: 'site' }),
  render: function() {
    if (!this.model) return this;
    var data = this.model.toJSON(),
        view = this;
    $.getJSON('/v0/user/usernames', function(users) {
      data.builds = _(data.builds).chain().map(function(build) {
        build.username = users[build.user];
        build.completedAtFormatted = build.completedAt ?
          moment(new Date(build.completedAt)).format('L LT') : undefined;
        return build;
      }).sortBy('createdAt').value().reverse();
      view.$el.html(view.template(data));
    });
    return this;
  }
});
module.exports = BuildsView;
