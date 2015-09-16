var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var CodeMirror = require('codemirror');
require('codemirror/mode/yaml/yaml');

var createProseMirror = require('./prosemirror').create;

var Document = require('../../models/Document');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/file.html').toString();

var EditorView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click [data-tab]': 'toggleAreas',
    'click [data-action=save-content]': 'saveDocument'
  },
  template: _.template(templateHtml),
  initialize: function (opts) {
    var self      = this,
        activeTab = 'content',
        settingsEditorEl, contentEditorEl;

    this.editors = {};
    this.path = opts.path;
    this.showContent = true;

    if (this.path.fileExt === 'yml') {
      this.doc = new Document({ yml: opts.content });
      this.showContent = false;
      activeTab = 'metadata';
    }
    else if (this.path.fileExt === 'md') {
      this.doc = new Document({ markdown: opts.content });
    }

    this.$el.html(this.template({
      fileName: this.path.file,
      showContent: this.showContent,
      activeTab: activeTab
    }));

    settingsEditorEl = this.$('[data-target=metadata]')[0];
    this.editors.settings = CodeMirror(settingsEditorEl, {
      lineNumbers: true,
      mode: "yaml",
      tabSize: 2
    });

    contentEditorEl = window.e = this.$('[data-target=content]')[0];
    if (this.showContent) {
      try {
        // try to load content into prosemirror
        this.editors.content = this.editors.content || createProseMirror(contentEditorEl);
        this.editors.content.setContent(this.doc.content, 'markdown');
      }
      catch (e) {
        // if prosemirror errors out, use codemirror
        $(contentEditorEl).empty(); // remove prosemirror
        this.editors.content = CodeMirror(contentEditorEl, {
          lineNumbers: true,
          lineWrapping: true
        });
        this.editors.content.doc.setValue(this.doc.content);
      }
    }

    if (this.doc.frontMatter) {
      this.editors.settings.doc.setValue(this.doc.frontMatter);
    }

    return this;
  },
  render: function () {
    var self        = this,
        doc         = this.doc;

    window.setTimeout(function() {
      self.editors.settings.refresh();
      if (self.editors.content.refresh) self.editors.content.refresh();
    }, 0);

    return this;
  },
  setActiveTab: function (target) {
    var t = '[data-tab-show=' + target + ']';
    $(t).parents('li').addClass('active');

    if (target === 'metadata') {
      $('[data-tab-show=content]').parents('li').removeClass('active');
      $('form#content').hide();
      $('form#metadata').show();
      this.editors.settings.refresh();
    }
    else {
      $('[data-tab-show=metadata]').parents('li').removeClass('active');
      $('form#metadata').hide();
      $('form#content').show();
    }
  },
  toggleAreas: function (e) {
    var target = e.target.dataset.tabShow;
    this.setActiveTab(target);

    return this;
  },
  saveDocument: function (e) {
    var settings,
        content;

    settings = this.editors.settings.doc.getValue();
    if (this.editors.content.content) {
      // ProseMirror is loaded as content editor
      content = this.editors.content.getContent('markdown');
    }
    else {
      // CodeMirror is loaded as content editor
      content = this.editors.content.doc.getValue();
    }


    if (settings) {
      this.doc.frontMatter = settings;
    }
    else {
      this.doc.frontMatter = false;
    }
    if (content) {
      this.doc.content = content;
    }

    this.trigger('edit:save', {
      md: this.doc.toMarkdown(),
      msg: this.$('#save-content-message').val()
    });
    return this;
  }
});

module.exports = EditorView;
