var Backbone = require('backbone');
var _ = require('underscore');
var markdown = require('html2markdown');

var typesToBlocks = {
  'h1': 'h1',
  'h2': 'h2',
  'h3': 'h3',
  'p': 'text',
  'ul': 'unordered',
  'ol': 'ordered'
};

var BlockModel = Backbone.Model.extend({
  initialize: function (opts) {
    this.data = opts;

    if (opts.html) {
      // creating a block straight from an HTML element
      // will need to look and check to see type of block
      var el = opts.html;
      this.initializeFromHTMLEl(el);
    }
    else if (opts.type) {
      // this is a block that comes straight from
      // the Sir Trevor editor.
      this.tagName = _.invert(typesToBlocks)[opts.type];
      this.type = opts.type;
      this.data = opts.data

      return this;
    }
  },
  initializeFromHTMLEl: function (el) {
    this.tagName = el.nodeName.toLowerCase();
    this.type = typesToBlocks[this.tagName];
    this.data = {};
    this.data['format'] = 'html';

    if (_.contains(['ul', 'ol'], this.tagName)) {
      this.data.listItems = _.map(el.children, function (child) {
        return {
          content: child.innerHTML
        };
      });
    }
    else {
      this.data['text'] = el.innerHTML;
    }

    return this;
  },
  toJSON: function () {
    return {
      'type': typesToBlocks[this.tagName],
      'data': this.data
    };
  },
  toMarkdown: function () {
    if (_.contains(['h1', 'h2', 'h3'], this.type)) {
      return markdownHeadingBlock(this);
    }
    else if (_.contains(['unordered', 'ordered'], this.type)) {
      return markdownListBlock(this);
    }
    else if (this.type === 'text') {
      return markdownTextBlock(this);
    }
    else if (this.type === 'code') {
      return markdownCodeBlock(this);
    }
    else {
      console.log('lost', this);
    }
  }
});

var BlockCollection = Backbone.Collection.extend({
  model: BlockModel,
  initialize: function (opts) {
    return this;
  },
  toJSON: function () {
    var modelsJson = this.models.map(function (model) {
      return model.toJSON();
    });
    return { data: modelsJson };
  },
  toMarkdown: function () {
    return this.models.map(function (model) {
      return model.toMarkdown();
    }).join('\n');
  }
});

function markdownTextBlock (block) {
  var text = markdown(block.data.text);
  return text;
}

function markdownCodeBlock (block) {
  var template = _.template('```\n <%- content %> \n```')
  return template({content: block.data.text})
}

function markdownListBlock (block) {
  var symbol,
      listItems;
  block.type === 'unordered' ? symbol = '* ' : symbol = '0. ';

  listItems = block.data.listItems.map(function(li) {
    return symbol + markdown(li.content);
  });
  return listItems.join('\n');
}

function markdownHeadingBlock (block) {
  var symbol,
      div = document.createElement('div'),
      numberOfOctothorpes = {
        'h1': 1,
        'h2': 2,
        'h3': 3,
        'h4': 4,
        'h5': 5,
        'h6': 6
      };

  div.innerHTML = block.data.text;
  // make a string w/ the right number of # signs to use
  // and add a space at the end
  symbol = Array(numberOfOctothorpes[block.tagName] + 1).join('#') + ' ';
  return symbol + div.innerText;
}

module.exports.model = BlockModel;
module.exports.collection = BlockCollection;
