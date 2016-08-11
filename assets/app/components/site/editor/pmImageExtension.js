import ProseMirror from 'prosemirror/dist/edit';
import { Schema, Attribute } from 'prosemirror/dist/model';
import { Image, schema } from 'prosemirror/dist/schema-basic';
import { menuBar, insertItem } from "prosemirror/dist/menu";
import { exampleSetup, buildMenuItems } from "prosemirror/dist/example-setup";

//require('prosemirror/dist/menu/menubar'); // Load menubar module
//require('prosemirror/dist/markdown');
//require('prosemirror/dist/serialize/markdown');

//var AddImageView = require('../add-image');
//var defaultImageNode = defaultSchema.nodes.image;

const defaults = { default: '' };

class FedImage extends Image {
  get attrs() {
    return {
      repo: new Attribute(defaults),
      branch: new Attribute(defaults),
      filePath: new Attribute(defaults)
    }
  }
}

const fedImageSchema = new Schema({
  nodes: schema.nodeSpec.addBefore("image", "fedImage", {
    type: FedImage,
    group: 'inline'
  }),
  marks: schema.markSpec
});

// const fedImageMenuItem = insertItem(fedImageSchema.nodes.fedImage, {
//   title: "click me",
//   label: "koolaid man",
//   attrs(pm, callback) {
//     console.log('arguments', arguments);
//     alert('oh yeah');
//     // i guess here is where we call a parent function via props to update the state/render a new component
//   }
// });

exports.fedImageSchema = fedImageSchema;
//exports.fedImageMenuItem = fedImageMenuItem;

// console.log(FedImage, FedImage.prototype);
// debugger
// // defaultImageNode.attrs = Object.assign({}, defaultImageNode.attrs, {
// //   repo: new Attribute(defaults),
// //   branch: new Attribute(defaults),
// //   filePath: new Attribute(defaults)
// // });
//
//
//
//
// defaultImageNode.prototype.parseMarkdown = [];
// defaultImageNode.register("parseMarkdown", {
//   token: "image",
//   parse: function parse(state, tok) {
//     var filePath = state.getAttr(tok, "src")
//                     .replace('https://raw.githubusercontent.com/', '')
//                     .split('/').slice(-2).join('/');
//
//     state.addInline(this, null, {
//       filePath: filePath,
//       src: state.getAttr(tok, "src"),
//       title: state.getAttr(tok, "title") || null,
//       alt: tok.children[0] && tok.children[0].content || null
//     });
//   }
// });
//
// // defaultImageNode.prototype.serializeMarkdown = function (state, node) {
// //   var imageMd = _.template("![<%- alt %>](<%- src %>)"),
// //       leadingSpace = (state.out.match(/\s$/g)) ? '' : ' ',
// //       md = imageMd({
// //         alt: (node.attrs.alt || ""),
// //         src: ['{{ site.baseurl }}', node.attrs.filePath].join('/'),
// //         title: node.attrs.title
// //       });
// //   state.write(leadingSpace + md);
// // };
//
// defaultImageNode.prototype.commands = [];
// defaultImageNode.attachCommand("insertImage", function(nodeType) {
//   return {
//     name: "insertImage",
//     label: "Add image",
//     run: function(pm, param) {
//       var parent = document.getElementById('add-asset-panel');
//           //addImage = new AddImageView();
//
//       //parent.empty();
//       parent.append('<h1>oh hai</h1>');
//
//       window.scrollTo(0, parent.position().top - 30);
//
//       addImage.once('asset:selected', function (attrs) {
//         var i = nodeType.create(attrs);
// //        var top = $(pm.sel.lastHeadNode.parentElement).position().top;
//         window.scrollTo(0, 0);
//         pm.tr.insertInline(pm.selection.head, i).apply();
//         //addImage.remove();
//       });
//
//       return;
//     },
//     icon: {
//       width: 1097,
//       height: 1024,
//       path: "M365 329q0 45-32 77t-77 32-77-32-32-77 32-77 77-32 77 32 32 77zM950 548v256h-804v-109l182-182 91 91 292-292zM1005 146h-914q-7 0-12 5t-5 12v694q0 7 5 12t12 5h914q7 0 12-5t5-12v-694q0-7-5-12t-12-5zM1097 164v694q0 37-26 64t-64 26h-914q-37 0-64-26t-26-64v-694q0-37 26-64t64-26h914q37 0 64 26t26 64z"
//     },
//     display: "icon",
//     menuGroup: "inline",
//     menuRank: 99
//   };
// });
//
// var customNodes = {};
//
// export default new Schema(defaultSchema.spec.updateNodes(customNodes));
