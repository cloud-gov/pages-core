import React from 'react';
import codemirror from 'codemirror';

const propTypes = {
  initialFrontmatterContent: React.PropTypes.string,
  onChange: React.PropTypes.func,
  templateConfig: React.PropTypes.string
};

const defaultProps = {
  initialFrontmatterContent: '',
  onChange: () => {},
};

let rendered = false;

class Codemirror extends React.Component {
  componentDidMount() {
    const target = document.querySelector('#js-codemirror-target');
    this.editor = codemirror(target, {
      lineNumbers: true,
      mode: 'yaml',
      value: this.props.initialFrontmatterContent
    });
  }

  componentWillReceiveProps(nextProps) {
    const editorValue = this.editor.getValue();
    const {initialFrontmatterContent: frontmatter } = nextProps;

    if (editorValue) return;

    this.editor.setValue(frontmatter);
  }

  componentWillUnmount() {
    this.editor.off('change');
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.initialFrontmatterContent && !rendered) {
      // We force an update here to ensure the component gets rendered
      // no more than once with the supplied initialMarkdownContent
      this.forceUpdate();
      rendered = true;

      this.editor.on('change', (cm) => {
        this.props.onChange(cm.getValue().trimRight());
      });
    }

    // This component should never rerender as prosemirror provides
    // it's own rendering
    return rendered ? false : true;
  }

  render() {
    return (
      <div className="usa-width-one-half">
        <label><strong>Other Settings</strong></label>
        <div id="js-codemirror-target" className="editor"></div>
      </div>
    );
  }
}

Codemirror.propTypes = propTypes;
Codemirror.defaultProps = defaultProps;

export default Codemirror;
