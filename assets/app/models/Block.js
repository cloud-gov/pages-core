var Backbone = require('backbone');
var _ = require('underscore');
var markdown = require('html2markdown');

var typesToBlocks = {
  'h1': 'heading',
  'h2': 'heading',
  'h3': 'heading',
  'p': 'text',
  'ul': 'list',
  'ol': 'list'
};

var BlockModel = Backbone.Model.extend({
  initialize: function (opts) {
    // supply type or tagname
    if (opts.type) {
      // using for now since we'll need new blocks for all the header types we want to support
      this.tagName = _.invert(typesToBlocks)[opts.type];
      this.type = opts.type;
    }
    else {
      this.tagName = opts.tagName.toLowerCase();
      this.type = typesToBlocks[this.tagName];
    }
    this.html = opts.html;

    return this;
  },
  toHTML: function () {
    console.log('convert model to html');
  },
  toJSON: function () {
    return {
      'type': typesToBlocks[this.tagName],
      'data': { 'text': this.html }
    };
  },
  toMarkdown: function () {
    if (this.type === 'heading') {
      return markdownHeadingBlock(this);
    }
    else if (this.type === 'text') {
      return markdownTextBlock(this);
    }
    else if (this.type === 'list') {
      return markdownListBlock(this);
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
  fromHTML: function (htmlString) {
    var collection = this;
    var div = document.createElement('div');
    div.innerHTML = htmlString;

    var children = Array.prototype.slice.call(div.children);
    children.forEach(function (el) {
      var child = { tagName: el.tagName, html: el.innerHTML };
      collection.add(child);
    });

    return this;
  },
  toJSON: function () {
    var modelsJson = this.models.map(function (model) {
      return model.toJSON();
    });
    return JSON.stringify({ data: modelsJson });
  },
  toMarkdown: function () {
    return this.models.map(function (model) {
      return model.toMarkdown();
    }).join('\n');
  }
})

function markdownTextBlock (block) {
  return markdown(block.html);
}

function markdownListBlock (block) {
  // var listItems = block.listItems.map(function(li) {
  //   return '* ' + markdown(li.content);
  // });
  return ''//listItems.join('\n');
}

function markdownHeadingBlock (block) {
  var div = document.createElement('div');
  div.innerHTML = block.html;

  return '# ' + div.innerText;
}


module.exports.model = BlockModel;
module.exports.collection = BlockCollection;
