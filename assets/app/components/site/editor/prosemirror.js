
import React from 'react';
import prosemirror from 'prosemirror';
import { exampleSetup, buildMenuItems } from 'prosemirror/dist/example-setup'
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror/dist/markdown';
import { menuBar } from 'prosemirror/dist/menu';
import { schema } from 'prosemirror/dist/schema-basic';

const menu = buildMenuItems(schema);

const propTypes = {
  initialMarkdownContent: React.PropTypes.string,
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
    this.editor = new prosemirror.ProseMirror({
      doc: defaultMarkdownParser.parse(this.props.initialMarkdownContent),
      place: document.getElementById('js-prosemirror-target'),
      schema: schema,
      plugins: [
        menuBar.config({ content: menu.fullMenu })
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
