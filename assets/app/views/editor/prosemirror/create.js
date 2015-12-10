var _ = require('underscore');

var ProseMirror = require('prosemirror/dist/edit').ProseMirror
var elt = require('prosemirror/dist/dom').elt;
require('prosemirror/dist/menu/menubar'); // Load menubar module
require('prosemirror/dist/parse/markdown');
require('prosemirror/dist/serialize/markdown');

var ProseMirrorModel = require('prosemirror/dist/model');
var Schema = ProseMirrorModel.Schema;
var Attribute = ProseMirrorModel.Attribute;
var defaultSchema = ProseMirrorModel.defaultSchema;

var AddImageView = require('../add-image');

var defaultImageNode = defaultSchema.spec.nodes.image.type;
var defaults = { default: '' }
defaultImageNode.attributes['repo'] = new Attribute(defaults);
defaultImageNode.attributes['branch'] = new Attribute(defaults);
defaultImageNode.attributes['filePath'] = new Attribute(defaults);

defaultImageNode.prototype.parseMarkdown = [];
defaultImageNode.register("parseMarkdown", {
  token: "image",
  parse: function parse(state, tok) {
    var filePath = state.getAttr(tok, "src")
                    .replace('https://raw.githubusercontent.com/', '')
                    .split('/').slice(-2).join('/');

    state.addInline(this, null, {
      filePath: filePath,
      src: state.getAttr(tok, "src"),
      title: state.getAttr(tok, "title") || null,
      alt: tok.children[0] && tok.children[0].content || null
    });
  }
});

defaultImageNode.prototype.serializeMarkdown = function (state, node) {
  var imageMd = _.template("![<%- alt %>](<%- src %>)"),
      leadingSpace = (state.out.match(/\s$/g)) ? '' : ' ',
      md = imageMd({
        alt: (node.attrs.alt || ""),
        src: ['{{ site.baseurl }}', node.attrs.filePath].join('/'),
        title: node.attrs.title
      });
  state.write(leadingSpace + md);
}

defaultImageNode.prototype.commands = [];
defaultImageNode.attachCommand("insertImage", function(nodeType) {
  return {
    name: "insertImage",
    label: "Add image",
    run: function(pm, param) {
      var parent = $('#add-asset-panel'),
          addImage = new AddImageView();

      parent.empty();
      parent.append(addImage.el);

      window.scrollTo(0, parent.position().top - 30);

      addImage.once('asset:selected', function (attrs) {
        var i = nodeType.create(attrs);
        var top = $(pm.sel.lastHeadNode.parentElement).position().top;
        window.scrollTo(0, top);
        pm.tr.insertInline(pm.selection.head, i).apply();
        addImage.remove();
      });

      return;
    },
    icon: {
      width: 1097,
      height: 1024,
      path: "M365 329q0 45-32 77t-77 32-77-32-32-77 32-77 77-32 77 32 32 77zM950 548v256h-804v-109l182-182 91 91 292-292zM1005 146h-914q-7 0-12 5t-5 12v694q0 7 5 12t12 5h914q7 0 12-5t5-12v-694q0-7-5-12t-12-5zM1097 164v694q0 37-26 64t-64 26h-914q-37 0-64-26t-26-64v-694q0-37 26-64t64-26h914q37 0 64 26t26 64z"
    },
    display: "icon",
    menuGroup: "inline",
    menuRank: 99
  }
});

var customNodes = {};
var federalistSchema = new Schema(defaultSchema.spec.updateNodes(customNodes));

module.exports = function create(placeEl) {
  var editor = window.federalist.pm = new ProseMirror({
    place: placeEl,
    menuBar: {
      float: true
    },
    schema: federalistSchema
  });

  return editor;
}
