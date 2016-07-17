
import React from 'react';
import prosemirror from 'prosemirror';
import { exampleSetup, buildMenuItems } from 'prosemirror/dist/example-setup'
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror/dist/markdown';
import { menuBar } from 'prosemirror/dist/menu';
import { schema } from 'prosemirror/dist/schema-basic';

const menu = buildMenuItems(schema);

class Prosemirror extends React.Component {
  constructor(props) {
    super(props);

    this.toMarkdown = this.toMarkdown.bind(this);
  }

  componentDidMount() {
    this.editor = new prosemirror.ProseMirror({
      doc: defaultMarkdownParser.parse(this.props.initialMarkdownContent),
      place: document.querySelector('#js-prosemirror-target'),
      schema: schema,
      plugins: [
        menuBar.config({ content: menu.fullMenu })
      ]
    });

    this.editor.on.change.add(() => {
      const doc = this.editor.doc.toJSON();
      this.setState({ doc });
    });
  }

  toMarkdown() {
    return defaultMarkdownSerializer.serialize(this.editor.doc);
  }

  render() {
    return (
      <div>
        <div id="js-prosemirror-target"></div>
      </div>
    )
  }
}

Prosemirror.defaultProps = {
  initialMarkdownContent: '*yo*\nhey there'
};

Prosemirror.propTypes = {
  initialMarkdownContent: React.PropTypes.string
};

export default Prosemirror;
