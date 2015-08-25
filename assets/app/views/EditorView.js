var fs = require('fs');

var Backbone = require('backbone');
var _ = require('underscore');
var SirTrevor = require('sir-trevor');

var Document = require('../models/Document');

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
    'click #save-content-action': 'saveDocument'
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

    this.$el.html(_.template(templateHtml)({ fileName: this.fileName }));
    this.editor = new SirTrevor.Editor({
      el: this.$('.js-st-instance'),
      blockTypes: ["H1", "H2", "H3", "Text", "Unordered", "Ordered"]
    });

    this.$('.js-st-instance').text(doc.toSirTrevorJsonString());
    this.editor.reinitialize();

    return this;
  },
  saveDocument: function (e) {
    SirTrevor.onBeforeSubmit();
    this.doc.updateContentFromSirTrevorJson(this.editor.store.retrieve());
    this.trigger('edit:save', {
        md: this.doc.toMarkdown(),
        msg: this.$('#save-content-message').val()
    });
    return this;
  }
});

module.exports = EditorView;
