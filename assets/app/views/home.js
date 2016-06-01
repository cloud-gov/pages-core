var Backbone = require('backbone');
var fs = require('fs');
var templateHtml = fs.readFileSync(__dirname + '/../templates/home.html').toString();

// Incredibly simple view to render the main content in case of Passport Errors.
// This handles the edge case of refreshing the page with a URL error.
var Home = Backbone.View.extend({
  template: templateHtml,

  render: function render() {
    this.$el.html(this.template);
    return this;
  }
});

module.exports = Home;
