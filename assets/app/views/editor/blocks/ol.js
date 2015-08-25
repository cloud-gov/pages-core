var SirTrevor = require('sir-trevor');

module.exports = SirTrevor.Blocks.List.extend({
  type: 'ordered',
  icon_name: 'list',
  title: function() { return 'Number List'; },
  editorHTML: '<ol class="st-list-block__list"></ol>',
  setupListVariables: function() {
    this.$ul = this.$inner.find('ol');
    this.ul = this.$ul.get(0);
  }
});
