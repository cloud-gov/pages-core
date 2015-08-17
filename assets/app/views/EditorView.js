var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var toMarkdown = require('to-markdown');
var markdown = require('markdown').markdown;

var SirTrevor = require('sir-trevor');

// var Block = require('../models/Block').model;
// var Blocks = require('../models/Block').collection;

var headings = require('./blocks/heading');
SirTrevor.Blocks.H1 = headings.h1;
SirTrevor.Blocks.H2 = headings.h2;
SirTrevor.Blocks.H3 = headings.h3;
SirTrevor.Blocks.Ordered = require('./blocks/ol');
SirTrevor.Blocks.Unordered = require('./blocks/ul');
SirTrevor.Blocks.Code = require('./blocks/code');

var templateHtml = fs.readFileSync(__dirname + '/../templates/EditorTemplate.html').toString();

var EditorView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click #save-content-action': 'saveDocument'
  },
  initialize: function (opts) {
    this.doc = extractFrontMatter(opts.content);
    this.file = opts.file;
    return this;
  },
  render: function () {
    var doc     = this.doc,
        blocks  = [],
        editor, mdTree;

    this.$el.html(_.template(templateHtml)({ file: this.file }));
    this.editor = new SirTrevor.Editor({
      el: this.$('.js-st-instance'),
      blockTypes: ["H1", "H2", "H3", "Text", "Unordered", "Ordered"]
    });

    mdTree = markdown.parse(doc.content).slice(1);
    for (var i = 0; i < mdTree.length; i++) {
      blocks.push(jsonMLToBlock(mdTree[i]));
    }

    this.$('.js-st-instance').text(JSON.stringify({ data: blocks }));
    this.editor.reinitialize();

    return this;
  },
  saveDocument: function (e) {
    var msg = this.$('#save-content-message').val(),
        blocks, blockData, md;
    SirTrevor.onBeforeSubmit();
    blockData = this.editor.store.retrieve();
    blocks = blockData.data.map(function(b) {
      var htmlString = blockToHTMLString(b)
      return htmlString;
    }).join('\n');

    md = combineFrontMatter(this.doc.frontMatter, toMarkdown(blocks));
    this.trigger('edit:save', { md: md, msg: msg });
    return this;
  }
});

function extractFrontMatter(markdownString) {
  // takes a markdown document that might have YAML frontmatter
  // and separate out the content of the doc from the frontmatter
  // returns an object like:
  // {  frontmatter: <DOC'S FRONT MATTER>,
  //    content: <DOC CONTENT> }
  var result = { frontMatter: {}, content: markdownString },
      p      = markdownString.split('---\n');

  if (p[0] !== '') return result;
  p[1].split('\n').forEach(function(pair) {
    var splitIndex = pair.indexOf(': '),
        key   = pair.slice(0, splitIndex),
        value = pair.slice(splitIndex + 2);

    if (key !== '' && value !== undefined) { result.frontMatter[key] = value; }
  });
  result.content = p[2];
  return result;
}

function combineFrontMatter(frontMatter, content) {
  var textFrontMatter = '---\n';
  for (key in frontMatter) {
    var text = key + ': ' + frontMatter[key];
    textFrontMatter += text + '\n';
  }
  textFrontMatter += '---\n\n';

  return textFrontMatter + content;
}

function jsonMLToBlock (j) {
  // Takes a jsonML representation from the markdown parser
  // and converts it into a format that Sir Trevor will be
  // able to render as a block
  var block = {
    type: '',
    data: {
      'format': 'html'
    }
  };

  if (j[0] === 'header') {
    block.type = 'h' + j[1].level;
    block.data.text = j[2]; //'<p>' + j[2] + '</p>';
  }
  else if (j[0] === 'para') {
    block.type = 'text';
    block.data.text = markdown.toHTML(j); //'<p>' + markdown.toHTML(j) + '</p>';
  }

  return block;
}

function blockToHTMLString (b) {
  // Takes a Sir Trevor block from the editor and converts it
  // to an HTML string representation for the markdown converter
  var div = document.createElement('div'),
      htmlString, tagName, insideHTML;

  if (_.contains(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], b.type)) {
    tagName = b.type;
    div.innerHTML = b.data.text;
    if (div.children[0].tagName.toLowerCase() === 'p') {
      insideHTML = div.children[0].innerHTML;
    }

    htmlString = '<' + tagName + '>' + insideHTML + '</' + tagName + '>';
  }
  else if (b.type === 'text') {
    // this is just a straight 'para' or <p>
    htmlString = b.data.text;
  }
  else if (_.contains(['unordered', 'ordered'], b.type)) {
    // if it is a list of either type, iterate through the items
    // and create li strings
    (b.type === 'unordered') ? tagName = 'ul' : tagName = 'ol';
    insideHTML = b.data.listItems.map(function(li) {
      return '<li>' + li.content + '</li>';
    }).join('');

    htmlString = '<' + tagName + '>' + insideHTML + '</' + tagName + '>';
  }

  return htmlString;
}

module.exports = EditorView;
