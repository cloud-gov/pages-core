
import React from 'react';
import prosemirror from 'prosemirror';
import { exampleSetup, buildMenuItems } from 'prosemirror/dist/example-setup'
import { defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser } from 'prosemirror/dist/markdown';
import { menuBar, insertItem, wrapListItem } from 'prosemirror/dist/menu';
import { schema } from 'prosemirror/dist/schema-basic';
import {fedImageSchema, fedImageMenuItem} from './pmImageExtension';

const propTypes = {
  initialMarkdownContent: React.PropTypes.string,
  handleToggleImages: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func
};

const defaultProps = {
  initialMarkdownContent: '',
  onChange: () => {}
};

class Prosemirror extends React.Component {
  constructor(props) {
    super(props);

    this.toMarkdown = this.toMarkdown.bind(this);
  }

  componentDidMount() {
    const { handleToggleImages } = this.props;
    const customNodes = Object.assign({}, defaultMarkdownSerializer.nodes, {
      image: (state, node) => {
        const alt = state.esc(node.attrs.alt || '');
        const src = state.esc(['{{ site.baseurl }}', node.attrs.src].join('/'));
        const title = node.attrs.title;

        state.write(`![${alt}](${src})`);
      }
    });

    const newImage = insertItem(schema.nodes.image, {
      label: 'Image',
      attrs: (pm, callback) => {
        handleToggleImages();
      }
    });

    defaultMarkdownSerializer.nodes = customNodes;
    const menu = buildMenuItems(schema);
    menu.insertMenu.content[0] = newImage;


    this.editor = new prosemirror.ProseMirror({
      doc: defaultMarkdownParser.parse(this.props.initialMarkdownContent),
      place: document.getElementById('js-prosemirror-target'),
      schema: schema,
      plugins: [
        exampleSetup.config({menuBar: {float: true, content: menu.fullMenu}})
      ]
    });

    this.editor.on.change.add(() => {
      this.props.onChange(this.toMarkdown());
    });
  }

  componentWillReceiveProps(nextProps) {
    const markdown = this.toMarkdown();
    const sameContent = (markdown === nextProps.initialMarkdownContent);

    if (sameContent) return;

    const doc = defaultMarkdownParser.parse(nextProps.initialMarkdownContent);
    this.editor.setDoc(doc);
  }

  componentWillUnmount() {
    const changeHandlers = this.editor.on.change.handlers;
    changeHandlers.forEach((handler) => {
      this.editor.on.change.remove(handler.fn);
    });
  }

  toMarkdown() {
    return defaultMarkdownSerializer.serialize(this.editor.doc);
  }

  render() {
    return (
      <div>
        <strong>ProseMirror instance</strong>
        <div id="js-prosemirror-target" className="editor"></div>
      </div>
    );
  }
}

Prosemirror.defaultProps = defaultProps;
Prosemirror.propTypes = propTypes;

export default Prosemirror;
