var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var templateHtml = fs.readFileSync(__dirname + '/../templates/SiteEditTemplate.html').toString();

var SiteEditView = Backbone.View.extend({

  template: _.template(templateHtml, { variable: 'model' }),

  events: {
    'submit': 'save'
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
  }

});

module.exports = SiteEditView;
