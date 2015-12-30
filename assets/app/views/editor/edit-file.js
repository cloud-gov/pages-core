var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var yaml = require('yamljs');

var CodeMirror = require('codemirror');
require('codemirror/mode/yaml/yaml');

var createProseMirror = require('./prosemirror/create');

var decodeB64 = require('../../helpers/encoding').decodeB64;

var Document = require('../../models/Document');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/file.html').toString();
var whitelistFieldHtml = fs.readFileSync(__dirname + '/../../templates/editor/whitelist-field.html').toString();

var EditorView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click [data-action=save-content]': 'saveDocument'
  },
  template: _.template(templateHtml),
  initialize: function (opts) {
    var self      = this,
        file      = filePathFromModel(this.model),
        raw, content;

    this.editors = {};
    this.path = opts.path;
    this.isNewPage = opts.isNewPage || false;
    this.settingsFields = _.extend({
      title: {
        type: 'text'
      },
      fake: {
        type: 'boolean'
      },
      layout: {
        type: 'select',
        options: self.model.getLayouts()
      },
      author: {
        type: 'text'
      },
      published: {
        type: 'date'
      }
    }, opts.settingsFields || {});

    this.model.on('github:commit:success', this.saveSuccess.bind(this));
    this.model.on('github:commit:error', this.saveFailure.bind(this));

    if (!this.isNewPage) {
      raw = decodeB64(this.model.attributes.json.content);
      content = this.cleanContent(raw);
      this.doc = new Document({
        fileExt: this.model.get('file').split('.')[1],
        content: content
      });
    }
    else {
      this.doc = new Document({
        fileExt: 'md',
        content: ['---', this.model.getDefaults(), '---', '\n'].join('\n')
      });
    }

    this.$el.html(this.template({ fileName: this.model.get('file') }));

    this.initializeSettingsEditor(this.doc);
    this.initializeContentEditor(this.doc);

    io.socket.get('/v0/site/lock', { file: file }, function(data) {

      // Store the socket ID for future reference
      self.socket = data.id;

      // Apply the lock
      self.lockContent.bind(self);

      // On any change events (others open or leave the page), reapply the lock
      io.socket.on('change', self.lockContent.bind(self));

      // If the user navigates away from the page, remove the lock
      // The server will do this automatically if the socket session breaks
      federalist.once('route', function() {
        $('.alert-container').html('');
        io.socket.get('/v0/site/unlock', { file: file });
      });

    });

    return this;
  },
  initializeSettingsEditor: function (doc) {
    var settings, settingsEditorEl;

    settingsEditorEl = this.$('[data-target=settings]')[0];
    this.editors.settings = CodeMirror(settingsEditorEl, {
      lineNumbers: true,
      mode: "yaml",
      tabSize: 2
    });

    if (doc.frontMatter) {
      this.settings = this.parseSettings(doc);
      this.editors.settings.doc.setValue(this.settings.remaining);
    }
  },
  parseSettings: function (doc) {
    var self = this,
        y = yaml.parse(doc.frontMatter),
        whitelist;

    whitelist = Object.keys(y).filter(function(k) {
      return self.settingsFields[k];
    }).map(function(k) {
      var r = {
        name: k,
        label: k,
        type: self.settingsFields[k].type,
        value: y[k]
      };
      if (r.type === 'select') r.options = self.settingsFields[k].options;
      delete y[k];
      return r;
    });

    return {
      whitelist: whitelist,
      remaining: yaml.dump(y)
    }
  },
  initializeContentEditor: function (doc) {
    var contentEditorEl = this.$('[data-target=content]')[0];
    try {
      // try to load content into prosemirror
      this.editors.content = this.editors.content || createProseMirror(contentEditorEl);
      this.editors.content.setContent(doc.content || '', 'markdown');
    }
    catch (e) {
      // if prosemirror errors out, use codemirror
      $(contentEditorEl).empty(); // remove prosemirror
      this.editors.content = CodeMirror(contentEditorEl, {
        lineNumbers: true,
        lineWrapping: true
      });
      this.editors.content.doc.setValue(this.doc.content || '');
    }

    if (!doc.content) $(contentEditorEl).hide();
  },

  lockContent: function(data) {
    var first = (data.subscribers && data.subscribers[0]) ||
                      (this.socket.subscribers && this.socket.subscribers[0]);

    if (first !== this.socket) {
      var message = 'Another user is editing this file. Once they finish, this page will unlock and you will be able to edit it.';

      // This is so we can tell if a user is unlocked for the first time
      this.locked = true;

      // Add error message
      $('.alert-container').html(
        '<div class="usa-grid"><div class="usa-alert usa-alert-error" role="alert">' +
          message +
        '</div></div>'
      );

      // Disable / style form elements
      $('.CodeMirror, .ProseMirror').append('<div class="mask"></div>');
      $('.save-panel, .ProseMirror-menubar').remove();

    } else {

      // If unlocking for the first time, refresh the view
      if (this.locked) {
        this.locked = false;
        Backbone.history.loadUrl();
      }

    }
  },
  render: function () {
    var self = this;
    this.renderSettings();
    window.setTimeout(function() {
      self.editors.settings.refresh();
      if (self.editors.content && self.editors.content.refresh) {
        self.editors.content.refresh();
      }
    }, 0);

    return this;
  },
  renderSettings: function () {
    var self = this,
        html = _.template(whitelistFieldHtml),
        target = this.$('#whitelist');

    target.empty();
    this.settings.whitelist.forEach(function(w) {
      if (w.type === 'date') w.value = toIsoDateString(w.value);
      var el = html(w)
      target.append(el);
    });
  },
  /**
   * Replace {{ site.baseurl }} with Github URL so assets load
   *
   * @param {string} content
   * @return {string} content - with replaced baseUrls
   */
  cleanContent: function (content, model) {
    model = model || this.model;
    var baseUrl = ["https://raw.githubusercontent.com",
                    model.owner,
                    model.name,
                    model.branch
                  ].join('/');

    content = content.replace(/{{ site.baseurl }}/g, baseUrl);
    return content;
  },
  saveSuccess: function (e) {
    this.$('#save-status-result').removeClass('label-danger');
    this.$('#save-status-result').addClass('label-success');
    this.$('#save-status-result').text('Yay, the save was successful!');

    setTimeout(function() {
      $('#save-status-result').hide();
    }, 3000);
  },
  saveFailure: function (e) {
    var messages = {
          0:   'The internet is not connected. Please check your connection.',
          404: 'Whoops, looks like this page can not be found.',
          409: 'Uh oh, there was a conflict when saving',
          422: 'Github is missing something'
        },
        status = messages[e.response] || 'That hasn\'t happened before';

    this.$('#save-status-result').removeClass('label-success');
    this.$('#save-status-result').addClass('label-danger');

    this.$('#save-status-result').text(status);
  },
  saveDocument: function (e) {
    var self = this,
        settings = this.getSettingsFromEditor(),
        content = this.getContentFromEditor(),
        pageTitle;

    e.preventDefault(); e.stopPropagation();

    this.$('#save-status-result').show();
    this.$('#save-status-result').removeClass('label-success');
    this.$('#save-status-result').removeClass('label-danger');
    this.$('#save-status-result').text('Saving...');

    this.doc.frontMatter = false;

    if (settings) this.doc.frontMatter = settings;
    if (content) this.doc.content = content;

    if (this.isNewPage) {
      this.saveNewDocument();
    }
    else {
      this.model.commit({
        content: this.doc.toMarkdown(),
        message: this.$('#save-content-message').val()
      });
    }

    return this;
  },
  saveNewDocument: function () {
    var self = this;

    try {
      pageTitle = fileNameFromTitle(yaml.parse(settings).title);
    } catch (error) {
      pageTitle = (new Date()).getTime().toString();
    }

    pageTitle = [pageTitle.replace(/\W/g, '-'), 'md'].join('.');

    this.listenToOnce(this.model, 'github:commit:success', function(m){
      var owner = self.model.get('owner'),
          repoName  = self.model.get('repoName'),
          branch = self.model.get('branch'),
          url = ['#edit', owner, repoName, branch, m.request.path].join('/');

      window.location.hash = url;
    });

    this.model.commit({
      path: ['pages', pageTitle].join('/'),
      content: this.doc.toMarkdown(),
      message: 'Created ' + ['pages', pageTitle].join('/')
    });
  },
  getSettingsFromEditor: function () {
    var self = this,
        remaining = this.editors.settings.doc.getValue(),
        whitelist = this.settings.whitelist.map(function (v) {
          var sel = '[name=' + v.name + ']', value;
          if (v.type === 'boolean') {
            sel += ':checked';
          }

          value = self.$(sel).val();
          return [v.name, value].join(': ');
        }).join('\n');

    return [whitelist, remaining].join('\n');
  },
  getContentFromEditor: function () {
    var content;

    if (this.editors.content && this.editors.content.content) {
      // ProseMirror is loaded as content editor
      content = this.editors.content.getContent('markdown');
    }
    else if (this.editors.content) {
      // CodeMirror is loaded as content editor
      content = this.editors.content.doc.getValue();
    }

    return content;
  }
});

function toIsoDateString (date) {
  var d = date || new Date();
  return d.toISOString().substring(0, 10)
}

function filePathFromModel (model) {
  return path = [
    model.get('owner'),
    model.get('repoName'),
    model.get('branch'),
    model.get('file')
  ].join('/')
}

function fileNameFromTitle (title) {
  var unique = (new Date()).valueOf();
  title = title || unique.toString();

  return title.toLowerCase();
}

module.exports = EditorView;
