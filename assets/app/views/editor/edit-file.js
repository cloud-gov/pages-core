var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var SirTrevor = require('sir-trevor');

var Document = require('../../models/Document');

var headings = require('./blocks/heading');
SirTrevor.Blocks.H1 = headings.h1;
SirTrevor.Blocks.H2 = headings.h2;
SirTrevor.Blocks.H3 = headings.h3;
SirTrevor.Blocks.Ordered = require('./blocks/ol');
SirTrevor.Blocks.Unordered = require('./blocks/ul');
SirTrevor.Blocks.Code = require('./blocks/code');

var templateHtml = fs.readFileSync(__dirname + '/../../templates/editor/file.html').toString();
var metadataHtml = fs.readFileSync(__dirname + '/../../templates/editor/metadata.html').toString();

var EditorView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click [data-tab]': 'toggleAreas',
    'click [data-action=save-content]': 'saveDocument',
    'click [data-action=delete-row]': 'deleteMetaDataRow',
    'click [data-action=add-row]': 'addMetaDataRow'
  },
  initialize: function (opts) {
    this.path = opts.path;
    if (this.path.fileExt === 'yml') {
      this.doc = new Document({ yml: opts.content })
    }
    else if (this.path.fileExt === 'md') {
      this.doc = new Document({ markdown: opts.content });
    }
    return this;
  },
  render: function () {
    var self        = this,
        template    = _.template(templateHtml),
        rowTemplate = _.template(metadataHtml),
        doc         = this.doc;

    this.$el.html(template({ fileName: this.path.fileName }));
    this.editor = new SirTrevor.Editor({
      el: this.$('.js-st-instance'),
      blockTypes: ["H1", "H2", "H3", "Text", "Unordered", "Ordered"]
    });

    _.each(doc.frontMatter, function (value, key) {
      var row = rowTemplate({ key: key, value: value });
      self.$('#meta-data-rows').append(row);
    });

    this.$('.js-st-instance').text(doc.toSirTrevorJsonString());
    this.editor.reinitialize();

    if (this.doc.content) {
      this.setActiveTab('showContent');
    }
    else if (this.doc.frontMatter) {
      this.setActiveTab('showMetadata');
    }
    return this;
  },
  setActiveTab: function (target) {
    console.log('setting', target);
    $('#'+target).parents('li').addClass('active');

    if (target === 'showMetadata') {
      $('#showContent').parents('li').removeClass('active');
      $('form#content').hide();
      $('form#metadata').show();
    }
    else {
      $('#showMetadata').parents('li').removeClass('active');
      $('form#metadata').hide();
      $('form#content').show();
    }
  },
  toggleAreas: function (e) {
    var target = e.target.id;
    this.setActiveTab(target);

    return this;
  },
  saveDocument: function (e) {
    var formFrontMatter = {},
        formContent;

    SirTrevor.onBeforeSubmit();
    formContent = this.editor.store.retrieve();

    $('form#metadata .row').each(function(index, row) {
      var key   = $(row).find('.front-matter-key').val(),
          value = $(row).find('.front-matter-value').val();

      if (key) {
        formFrontMatter[key] = value;
      }
    });

    if (!_.isEmpty(formFrontMatter)) {
      this.doc.updateFrontMatter(formFrontMatter);
    }
    if (!_.isEmpty(formContent.data)) {
      this.doc.updateContentFromSirTrevorJson(formContent);
    }

    window.z = this.doc;

    // this.trigger('edit:save', {
    //     md: this.doc.toMarkdown(),
    //     msg: this.$('#save-content-message').val()
    // });
    return this;
  },
  deleteMetaDataRow: function (e) {
    e.preventDefault();
    $(e.target).parents('.row').remove();

    return this;
  },
  addMetaDataRow: function (e) {
    e.preventDefault();
    var rowTemplate = _.template(metadataHtml)({});
    $('#meta-data-rows').append(rowTemplate);

    return this;
  }
});

module.exports = EditorView;
