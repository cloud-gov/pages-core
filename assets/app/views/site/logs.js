var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/logs.html').toString();

var SiteLogsView = Backbone.View.extend({
  tagName: 'div',
  className: 'list',
  template: _.template(templateHtml, { variable: 'site' }),
  render: function() {
    if (!this.model) return this;
    this.fetchUsernames();
    return this;
  },
  fetchUsernames: function () {
    var view = this;
    $.getJSON('/v0/user/usernames', function(users) {
      var data = view.onFetchUsernames(users, view.model);
      view.$el.html(view.template(data));
    });
  },
  onFetchUsernames: function (users, model) {
    model = model || this.model;
    var data = this.model.toJSON(),
        view = this;

    data.builds = _(data.builds).chain().map(function(build) {
      return view.processBuild(build, users);
    }).sortBy('createdAt').value().reverse();

    return data;
  },
  processBuild: function (build, users) {
    var completedAt = build.completedAt && new Date(build.completedAt),
        createdAt = build.createdAt && new Date(build.createdAt),
        base = completedAt || new Date(),
        duration = moment.duration(moment(base).diff(createdAt)),
        item = _.clone(build);

    item.username = users[build.user];
    item.duration = duration.seconds();
    item.durationFormatted = duration.humanize();
    item.panelClass = build.state === 'error' ? 'error' :
      build.state === 'success' ? '' : 'info';

    if (completedAt) {
      item.completedAt = moment(completedAt).format('L LT');
      item.completedAtFormatted = moment(completedAt).fromNow();
    }

    return item;
  }
});
module.exports = SiteLogsView;
