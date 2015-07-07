var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var SirTrevor = require('sir-trevor');
var mdToHTML = require('markdown').markdown.toHTML;

var markdownBlock = require('/Users/jeremiakimelman/code/sir-trevor-playground/markdownBlockByType');
var markupBlock = require('/Users/jeremiakimelman/code/sir-trevor-playground/markupBlockByType');

var Block = require('../models/Block').model;
var Blocks = require('../models/Block').collection;

var templateHtml = fs.readFileSync(__dirname + '/../templates/EditTemplate.html').toString();

var EditView = Backbone.View.extend({
  events: {
    'click #markdown': 'saveBlocks'
  },
  tagName: 'div',
  template: _.template(templateHtml),
  initialize: function (opts) {
    this.path = opts.path || false;
  },
  render: function () {
    var html = this.template({ path: this.path });
    this.$el.html(html);

    var editorConfig = {
      el: this.$('.js-st-instance'),
      blockTypes: ["Heading", "Text", "List"]
    };

    getMarkdownFromUrl(this.path, function () {
      this.editor = new SirTrevor.Editor(editorConfig);
      window.scroll(0,0);
    }.bind(this));

    return this;
  },
  saveBlocks: function saveBlocks (e) {
    SirTrevor.onBeforeSubmit();
    var blockData = this.editor.store.retrieve();
    var blocks = new Blocks();
    blockData.data.map(function(b) {
      console.log('b', b);
      var block = new Block(b);
      blocks.add(block);
    });

    console.log('md', blocks.toMarkdown());
    return blocks.toMarkdown();
  }
});

function getMarkdownFromUrl (url, cb) {
  var base = 'https://raw.githubusercontent.com/';
  var url = url || '';
  var u = base + url;

  $.ajax(u, {
    complete: function (res, response) {
      if (res.status === 200) {
        var htmlString = mdToHTML(res.responseText);
        var blocks = new Blocks().fromHTML(htmlString);
        $('.js-st-instance').text(blocks.toJSON());
        cb();
      }
      else {
        console.log('error res', res);
      }
    }
  });
}

module.exports = EditView;
