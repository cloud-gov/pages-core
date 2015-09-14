var Backbone = require('backbone');
var _ = require('underscore');
var markdown = require('markdown').markdown;
var htmlToMarkdown = require('to-markdown');

var DocumentModel = Backbone.Model.extend({
  initialize: function (opts) {
    var parts;

    if (opts.markdown) {
      parts = opts.markdown.split('---\n');
      if (parts[0] === '') {
      /* if the markdown has yml */
        this.frontMatter = parts[1];
        this.content = parts[2];
      }
      else {
      /* if the markdown does not have yml */
        this.frontMatter = false;
        this.content = opts.markdown;
      }
    }
    else if (opts.yml) {
      this.frontMatter = opts.yml;
      this.content = false;
    }
    return this;
  },
  toMarkdown: function () {
    var lastCharIndex;
    if (!this.frontMatter) return this.content;
    if (!this.content) return this.frontMatter;

    // add a new line at the end if there isn't one already
    // this is so the front matter dashes are on the next line
    lastCharIndex = this.frontMatter.length - 1;
    if (this.frontMatter[lastCharIndex] !== '\n') {
      this.frontMatter += '\n';
    }

    return ['---\n', this.frontMatter, '---\n', this.content]
      .join('');
  }
});

module.exports = DocumentModel;
