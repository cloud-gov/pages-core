var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var SirTrevor = window.s = require('sir-trevor');
var mdToHTML = require('markdown').markdown.toHTML;

var Block = require('../models/Block').model;
var Blocks = require('../models/Block').collection;

var headings = require('./blocks/heading');
SirTrevor.Blocks.H1 = headings.h1;
SirTrevor.Blocks.H2 = headings.h2;
SirTrevor.Blocks.H3 = headings.h3;
SirTrevor.Blocks.Ordered = require('./blocks/ol');
SirTrevor.Blocks.Unordered = require('./blocks/ul');
SirTrevor.Blocks.Code = require('./blocks/code');

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
    var path = {
      repo: this.path.split('/').slice(0, 2).join('/'),
      file: this.path.split('/').slice(2, 4).join('/')
    }
    var html = this.template({ path: path });
    this.$el.html(html);

    if (!this.path) return this;

    var editorConfig = {
      el: this.$('.js-st-instance'),
      blockTypes: ["H1", "H2", "H3", "Text", "Unordered", "Ordered", "Code"]
    };

    getMarkdownFromUrl(this.path, function () {
      this.editor = new SirTrevor.Editor(editorConfig);

      this.$('.editor-preload').hide();
      this.$('.editor').show();

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
    return
  }
});

function getMarkdownFromUrl (url, cb) {
  var base = 'https://raw.githubusercontent.com/';
  var url = url || '';
  var u = base + url;

  $.ajax(u, {
    complete: function (res, response) {
      if (res.status === 200) {
        var blocks = window.b = new Blocks();
        var htmlString = mdToHTML(res.responseText);
        var htmlNodes = $(htmlString).filter(function(i, x) {
          return x.nodeName !== '#text';
        }).map(function(i, n) {
          // if we pass in an HTML node as the html value the block
          // can create itself properly
          blocks.add({ html: n });
        });

        var jsonBlocks = JSON.stringify(blocks.toJSON());
        $('.js-st-instance').text(jsonBlocks); // load JSON blocks into editor
        cb();
      }
      else {
        console.log('error res', res);
      }
    }
  });
}

module.exports = EditView;
