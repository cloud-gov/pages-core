var SirTrevor = require('sir-trevor');

module.exports.h1 = SirTrevor.Blocks.Heading.extend({
  type: 'h1',
  title: function() { return 'Heading 1'; },
});

module.exports.h2 = SirTrevor.Blocks.Heading.extend({
  type: 'h2',
  title: function() { return 'Heading 2'; },
  editorHTML: '<div class="st-required st-text-block st-text-block--heading heading-two" contenteditable="true"></div>'
});

module.exports.h3 = SirTrevor.Blocks.Heading.extend({
  type: 'h3',
  title: function() { return 'Heading 3'; },
  editorHTML: '<div class="st-required st-text-block st-text-block--heading heading-three" contenteditable="true"></div>'
});
