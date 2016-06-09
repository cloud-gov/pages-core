var _ = require('underscore');
var Backbone = require('backbone');
var yaml = require('yamljs');

var fileTypes = {
  'md': ['md', 'markdown'],
  'yml': ['yml', 'yaml']
};

var DocumentModel = Backbone.Model.extend({
  initialize: function (opts) {
    opts = opts || {};
    var fileExt = this.fileExtensionFromName(opts.fileName);
    this.set('fileName', this.getFileName(opts.fileName));

    if (this.isFileType('md', fileExt)) {
      this.initializeMarkdownDocument(opts.content)
    }
    else if (this.isFileType('yml', fileExt)) {
      this.initializeYamlDocument(opts.content);
    }
    else {
      this.initializeMarkdownDocument(['---', 'key: value','---', 'whatever content'].join('\n'))
    }

    return this;
  },
  isFileType: function (type, fileExt) {
    return _.contains(fileTypes[type], fileExt);
  },
  initializeMarkdownDocument: function (content) {
    var parts = this.splitYmlMarkdown(content);
    this.set({
      frontMatter: parts ? parts.yml : false,
      content: parts ? parts.md : content,
      fileExt: 'md'
    });
  },
  initializeYamlDocument: function (content) {
    this.set({
      frontMatter: content,
      content: false,
      fileExt: 'yml'
    });
  },
  getFileName: function (title) {
    var unique = (new Date()).valueOf();
    title = title || (unique.toString() + '.md');

    return title.toLowerCase();
  },
  fileExtensionFromName: function (name) {
    if (!name) {
      return false;
    }

    return name.split('.').pop();
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
