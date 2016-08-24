import React from 'react';
import prosemirror from 'prosemirror';
import { exampleSetup } from 'prosemirror/dist/example-setup'
import { markdownParser, markdownSerializer } from '../../../util/pmParserExtension';
import { schema } from 'prosemirror/dist/schema-basic';
import menuImageExtension from '../../../util/pmImageMenuExtension';

const propTypes = {
  initialMarkdownContent: React.PropTypes.string,
  handleToggleImages: React.PropTypes.func.isRequired,
  registerInsertImage: React.PropTypes.func,
  onChange: React.PropTypes.func
};

const defaultProps = {
  initialMarkdownContent: '',
  onChange: () => {}
};

let rendered = false;

class Prosemirror extends React.Component {
  constructor(props) {
    super(props);

    this.toMarkdown = this.toMarkdown.bind(this);
    this.insertImage = this.insertImage.bind(this);
  }

  componentDidMount() {
    const { handleToggleImages, initialMarkdownContent } = this.props;
    const menu = menuImageExtension(handleToggleImages);

    this.editor = new prosemirror.ProseMirror({
      doc: this.fromMarkdown(initialMarkdownContent),
      place: document.getElementById('js-prosemirror-target'),
      schema: schema,
      plugins: [
        exampleSetup.config({menuBar: {float: true, content: menu.fullMenu}})
      ]
    });

    this.props.registerInsertImage(this.insertImage);

    this.editor.on.change.add(() => {
      this.props.onChange(this.toMarkdown());
    });
  }

  componentWillReceiveProps(nextProps) {
    const markdown = this.props.initialMarkdownContent;
    const sameContent = (markdown === nextProps.initialMarkdownContent);
    const { selected } = nextProps;

    if (sameContent) return;

    const doc = this.fromMarkdown(nextProps.initialMarkdownContent);
    this.editor.setDoc(doc);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.initialMarkdownContent && !rendered) {
      // We force an update here to ensure the component gets rendered
      // no more than once with the supplied initialMarkdownContent
      this.forceUpdate();
      rendered = true;
    }

    // This component should never rerender as prosemirror provides
    // it's own rendering
    return rendered ? false : true;
  }

  componentWillUnmount() {
    const changeHandlers = this.editor.on.change.handlers;
    changeHandlers.forEach((handler) => {
      this.editor.on.change.remove(handler.fn);
    });
  }

  insertImage(image) {
    const imgNode = this.editor.schema.nodeType('image').create({
      src: image.download_url,
      title: image.name,
      alt: image.name
    });

    this.editor.tr.insertInline(this.editor.selection.head, imgNode).apply();
  }

  toMarkdown() {
    return markdownSerializer.serialize(this.editor.doc);
  }

  fromMarkdown(content) {
    const cleanContent = content.replace(/{{ site.baseurl }}\//g, '');

    return markdownParser.parse(cleanContent);
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
