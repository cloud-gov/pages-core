import React from 'react';
import Codemirror from './codemirror';
import Prosemirror from './prosemirror';

const propTypes = {
  frontmatter: React.PropTypes.string,
  markdown: React.PropTypes.string,
  handleChange: React.PropTypes.func,
  handleToggleImages: React.PropTypes.func,
  selected: React.PropTypes.object
};

let rendered = false;

class EditorContents extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { frontmatter, markdown, handleChange, handleToggleImages, selected } = this.props;

    return (
      <div>
        <Codemirror
          initialFrontmatterContent={ frontmatter }
          onChange={ (frontmatter) => {
            handleChange('frontmatter', frontmatter)
          }}
        />
        <Prosemirror
          initialMarkdownContent={ markdown }
          onChange={ (nextMarkdown) => {
            handleChange('markdown', nextMarkdown);
          }}
          handleToggleImages={handleToggleImages}
          selected={selected}
        />
      </div>
    );
  }
}

EditorContents.propTypes = propTypes;

export default EditorContents;
