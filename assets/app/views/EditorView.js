var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var SirTrevor = require('sir-trevor');

var Document = require('../models/Document');
// var Block = require('../models/Block').model;
// var Blocks = require('../models/Block').collection;

var headings = require('./blocks/heading');
SirTrevor.Blocks.H1 = headings.h1;
SirTrevor.Blocks.H2 = headings.h2;
SirTrevor.Blocks.H3 = headings.h3;
SirTrevor.Blocks.Ordered = require('./blocks/ol');
SirTrevor.Blocks.Unordered = require('./blocks/ul');
SirTrevor.Blocks.Code = require('./blocks/code');

var templateHtml = fs.readFileSync(__dirname + '/../templates/EditorTemplate.html').toString();

var EditorView = Backbone.View.extend({
  tagName: 'div',
  events: {
    'click [data-show-area]': 'toggleAreas',
    'click #save-content-action': 'saveDocument',
    'click .front-matter-delete': 'deleteMetaDataRow',
    'click #add-front-matter-row': 'addMetaDataRow'
  },
  initialize: function (opts) {
    this.doc = new Document({ markdown: opts.content });
    this.fileName = opts.file;
    return this;
  },
  render: function () {
    var doc     = this.doc,
        blocks  = [],
        editor, mdTree;

    this.$el.html(_.template(templateHtml)({ fileName: this.fileName, frontMatter: this.doc.frontMatter }));
    this.editor = new SirTrevor.Editor({
      el: this.$('.js-st-instance'),
      blockTypes: ["H1", "H2", "H3", "Text", "Unordered", "Ordered"]
    });

    this.$('.js-st-instance').text(doc.toSirTrevorJsonString());
    this.editor.reinitialize();
    $('form#metadata').hide();
    return this;
  },
  toggleAreas: function () {
    $('form#metadata').toggle();
    $('form#content').toggle();
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
    $(e.target).parents('.meta-data-rows .row').remove();

    return this;
  },
  addMetaDataRow: function (e) {
    e.preventDefault();
    var rowTemplate = _.template('<div class="row"><div class="col s5"><input type="text" class="front-matter-key" placeholder="key"></div><div class="col s5"><input type="text" class="front-matter-value" placeholder="value"></div><div class="col s2"><button class="front-matter-delete">Delete</button></div></div>')();
    $('.meta-data-rows').append(rowTemplate);

    return this;
  }
});

module.exports = EditorView;
