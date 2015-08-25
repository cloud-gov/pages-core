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
    this.doc = new Document({ markdown: opts.content });
    this.fileName = opts.file;
    return this;
  },
  render: function () {
    var self        = this,
        template    = _.template(templateHtml),
        rowTemplate = _.template(metadataHtml),
        doc         = this.doc;

    this.$el.html(template({ fileName: this.fileName }));
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

    $('form#metadata').hide();
    return this;
  },
  toggleAreas: function (e) {
    var target = e.target.id;
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
  saveDocument: function (e) {
    var formFrontMatter = {};
    SirTrevor.onBeforeSubmit();
    $('form#metadata .row').each(function(index, row) {
      var key   = $(row).find('.front-matter-key').val(),
          value = $(row).find('.front-matter-value').val();

      if (key) {
        formFrontMatter[key] = value;
      }
    });

    this.doc.updateFrontMatter(formFrontMatter);
    this.doc.updateContentFromSirTrevorJson(this.editor.store.retrieve());

    this.trigger('edit:save', {
        md: this.doc.toMarkdown(),
        msg: this.$('#save-content-message').val()
    });
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
