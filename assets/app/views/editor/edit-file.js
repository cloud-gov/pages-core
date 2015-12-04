var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');

var CodeMirror = require('codemirror');
require('codemirror/mode/yaml/yaml');

var createProseMirror = require('./prosemirror/create');

var decodeB64 = require('../../helpers/encoding').decodeB64;

var Document = require('../../models/Document');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/file.html').toString();

var EditorView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click [data-tab]': 'toggleAreas',
    'click [data-action=save-confirm]': 'saveDocument',
    'click [data-action=save-cancel]': 'cancelSave'
  },
  template: _.template(templateHtml),
  initialize: function (opts) {
    var self      = this,
        activeTab = 'content',
        fileExt = this.model.get('file').split('.')[1],
        content = this.cleanContent(decodeB64(this.model.attributes.json.content)),
        settingsEditorEl, contentEditorEl;

    this.editors = {};
    this.path = opts.path;
    this.showContent = true;

    this.on('click:save', this.promptSave.bind(this));
    this.model.on('github:commit:success', this.saveSuccess.bind(this));
    this.model.on('github:commit:error', this.saveFailure.bind(this));

    if (fileExt === 'yml') {
      this.doc = new Document({ yml: content });
      this.showContent = false;
      activeTab = 'metadata';
    }
    else if (fileExt === 'md' || fileExt === 'markdown') {
      this.doc = new Document({ markdown: content });
    }

    this.$el.html(this.template({
      fileName: this.model.get('file'),
      showContent: this.showContent,
      activeTab: activeTab
    }));

    settingsEditorEl = this.$('[data-target=metadata]')[0];
    this.editors.settings = CodeMirror(settingsEditorEl, {
      lineNumbers: true,
      mode: "yaml",
      tabSize: 2
    });

    contentEditorEl = this.$('[data-target=content]')[0];
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
    var self = this;

    window.setTimeout(function() {
      self.editors.settings.refresh();
      if (self.editors.content && self.editors.content.refresh) {
        self.editors.content.refresh();
      }
    }, 0);

    return this;
  },
  /**
   * Replace {{ site.baseurl }} with Github URL so assets load
   *
   * @param {string} content
   * @return {string} content - with replaced baseUrls
   */
  cleanContent: function (content) {
    var baseUrl = ["https://raw.githubusercontent.com",
                    this.model.owner,
                    this.model.name,
                    this.model.branch
                  ].join('/');

    content = content.replace(/{{ site.baseurl }}/g, baseUrl);
    return content;
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
  saveSuccess: function (e) {
    this.$('#save-status-result').removeClass('label-danger');
    this.$('#save-status-result').addClass('label-success');
    this.$('#save-status-result').text('Yay, the save was successful!');

    setTimeout(function() {
      $('#save-status-result').text('');
    }, 3000);
  },
  saveFailure: function (e) {
    var messages = {
          0:   'The internet is not connected. Please check your connection.',
          404: 'Whoops, looks like this page can not be found.',
          409: 'Uh oh, there was a conflict when saving',
          422: 'Github is missing something'
        },
        status = messages[status] || 'That hasn\'t happened before';

    this.$('#save-status-result').removeClass('label-success');
    this.$('#save-status-result').addClass('label-danger');

    this.$('#save-status-result').text(status);
  },
  saveDocument: function (e) {
    var settings,
        content;

    settings = this.editors.settings.doc.getValue();
    if (this.editors.content && this.editors.content.content) {
      // ProseMirror is loaded as content editor
      content = this.editors.content.getContent('markdown');
    }
    else if (this.editors.content) {
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

    this.model.commit({
      content: this.doc.toMarkdown(),
      message: this.$('#save-content-message').val()
    });

    return this;
  },
  promptSave: function() {
    this.$('#save-panel').show();
  },
  cancelSave: function () {
    this.$('#save-panel').hide();
  }
});

module.exports = EditorView;
