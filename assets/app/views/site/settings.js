var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/settings.html').toString();

var SiteSettingsView = Backbone.View.extend({
  template: _.template(templateHtml, { variable: 'model' }),
  events: {
    'submit': 'save',
    'click [data-action=delete-site]': 'onDelete'
  },
  render: function renderSiteEditView() {
    if (!this.model) return this;
    var data = this.model.toJSON();
    this.$el.html(this.template(data));
    return this;
  },
  save: function saveSiteEditView(e) {
    e.preventDefault();
    var data = _(this.$('form').serializeArray()).reduce(function(memo, value) {
          memo[value.name] = value.value;
          return memo;
        }, {}),
        view = this;
    this.model.save(data, {
      attrs: data,
      success: function() {
        view.trigger('site:save:success');
      }
    });
  },
  onDelete: function onDelete() {
    var opts = {
      success: this.onDeleteSuccess.bind(this),
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

module.exports = SiteSettingsView;
