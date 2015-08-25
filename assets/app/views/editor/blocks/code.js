var SirTrevor = require('sir-trevor');

module.exports = SirTrevor.Blocks.Text.extend({
  type: 'code',
  title: function() { return 'Code'; },
  editorHTML: '<pre><div class="st-required st-text-block" style="font-family:monospace;line-height:0;" contenteditable="true"></div></pre>',
});
