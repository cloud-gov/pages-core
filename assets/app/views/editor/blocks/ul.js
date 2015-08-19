var SirTrevor = require('sir-trevor');

module.exports = SirTrevor.Blocks.List.extend({
  type: 'unordered',
  title: function() { return 'Bullet List'; },
});
