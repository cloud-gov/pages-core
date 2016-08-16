
import React from 'react';
import prosemirror from 'prosemirror';
import { exampleSetup, buildMenuItems } from 'prosemirror/dist/example-setup'
import { markdownParser, markdownSerializer } from '../../../util/pmParserExtension';
import menuImageExtension from '../../../util/pmImageExtension';
import { schema } from 'prosemirror/dist/schema-basic';
debugger
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
    const menu = menuImageExtension(handleToggleImages);

    this.editor = new prosemirror.ProseMirror({
      doc: markdownParser.parse(this.props.initialMarkdownContent),
      place: document.getElementById('js-prosemirror-target'),
      schema: schema,
      plugins: [
        exampleSetup.config({menuBar: {float: true, content: menu.fullMenu}})
      ]
    });

    this.editor.on.change.add(() => {
      console.log('change')
      this.props.onChange(this.toMarkdown());
    });
  }

  componentWillReceiveProps(nextProps) {
    const markdown = this.toMarkdown();
    const sameContent = (markdown === nextProps.initialMarkdownContent);
    const { selected } = nextProps;

    if (sameContent) return;

    if (selected) {
      const imgNode = this.editor.schema.nodeType('image').create({
        src: selected.download_url,
        title: selected.name,
        alt: selected.name
      });
      this.editor.tr.insertInline(this.editor.selection.head, imgNode).apply();
    }

    const doc = markdownParser.parse(nextProps.initialMarkdownContent);
    this.editor.setDoc(doc);
  }

  componentWillUnmount() {
    const changeHandlers = this.editor.on.change.handlers;
    changeHandlers.forEach((handler) => {
      this.editor.on.change.remove(handler.fn);
    });
  }

  toMarkdown() {
    return markdownSerializer.serialize(this.editor.doc);
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
