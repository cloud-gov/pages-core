var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/site/settings.html').toString();

var SiteSettingsView = Backbone.View.extend({
  template: _.template(templateHtml, { variable: 'model' }),
  events: {
    'submit': 'onSave',
    'click [data-action=delete-site]': 'onDelete'
  },
  render: function renderSiteEditView() {
    if (!this.model) return this;
    var data = this.model.toJSON();
    this.$el.html(this.template(data));
    return this;
  },
  getFormData: function (sel) {
    var $el = this.$(sel);
    var data = this.formatFormData($el.serializeArray());

    return data;
  },
  formatFormData: function (serializedArray) {
    return _(serializedArray).reduce(function(memo, value) {
        memo[value.name] = value.value;
        return memo;
      }, {});
  },
  onSave: function saveSiteEditView(e) {
    e.preventDefault();
    var view = this;
    var data = this.getFormData('form');
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
