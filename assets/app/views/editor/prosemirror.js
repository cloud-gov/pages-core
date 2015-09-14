var ProseMirror = require("prosemirror/dist/edit").ProseMirror
require("prosemirror/dist/menu/menubar") // Load menubar module
require('prosemirror/dist/convert/from_markdown');
require('prosemirror/dist/convert/to_markdown');

function create(placeEl) {
  if (!placeEl) placeEl = document.querySelector('body');
  var editor = new ProseMirror({
    place: placeEl,
    menuBar: true
  });

  return editor;
}

module.exports.create = create;
