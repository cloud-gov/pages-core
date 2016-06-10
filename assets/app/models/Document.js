var _ = require('underscore');
var Backbone = require('backbone');
var yaml = require('yamljs');

var fileTypes = {
  'md': ['md', 'markdown'],
  'yml': ['yml', 'yaml']
};

var yamlDefaults = [
  "layout:",
  "- home",
  "- page",
  "- project-list",
  "- project"
].join('\n');

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
      this.initializeMarkdownDocument(['---', yamlDefaults, '---', ''].join('\n'));
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
    var frontMatter = this.get('frontMatter');
    var content = this.get('content');

    if (!frontMatter) {
      return content;
    }

    if (!content) {
      return frontMatter;
    }

    // add a new line at the end if there isn't one already
    // this is so the front matter dashes are on the next line
    lastCharIndex = frontMatter.length - 1;

    if (frontMatter[lastCharIndex] !== '\n') {
      frontMatter += '\n';
      this.set('frontMatter', frontMatter);
    }

    return ['---\n', frontMatter, '---\n', content]
      .join('');
  }
});

module.exports = DocumentModel;
