var _ = require('underscore');
var Backbone = require('backbone');
var yaml = require('yamljs');

var DocumentModel = Backbone.Model.extend({
  initialize: function (opts) {
    var parts;
    this.fileExt = opts.fileExt;
    if (opts.fileExt === 'md' || opts.fileExt === 'markdown') {
      parts = this.splitYmlMarkdown(opts.content);
      if (parts) {
        this.frontMatter = parts.yml;
        this.content = parts.md;
      }
      else {
        this.frontMatter = '';
        this.content = opts.content;
      }
    }
    else if (opts.fileExt === 'yml' || opts.fileExt === 'yaml') {
      this.frontMatter = opts.content;
      this.content = false;
    }
    return this;
  },
  splitYmlMarkdown: function (content) {
    var r = /^---\n([\s\S]*?)---\n/,
        matches = content.match(r),
        yml, md, x;

    if (!matches) return false;

    x = matches[0];
    yml = matches[1];
    md = content.slice(x.length);

    return { yml: yml, md: md};
  },
  toMarkdown: function () {
    var lastCharIndex;
    if (!this.frontMatter) return this.content;
    else if (!this.content) return this.frontMatter;

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
