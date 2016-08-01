
import React from 'react';
import codemirror from 'codemirror';

const propTypes = {
  initialFrontmatterContent: React.PropTypes.string,
  onChange: React.PropTypes.func
};

const defaultProps = {
  initialFrontmatterContent: '',
  onChange: () => {}
};

class Codemirror extends React.Component {
  componentDidMount() {
    const target = document.querySelector('#js-codemirror-target');
    this.editor = codemirror(target, {
      lineNumbers: true,
      mode: 'yaml',
      value: this.props.initialFrontmatterContent
    });

    this.editor.on('change', (cm) => {
      this.props.onChange(cm.getValue());
    });
  }

  componentWillReceiveProps(nextProps) {
    const frontmatter = this.editor.getValue();
    const sameContent = (frontmatter === nextProps.initialFrontmatterContent);

    if (sameContent) return;
    this.editor.setValue(nextProps.initialFrontmatterContent);
  }

  componentWillUnmount() {
    this.editor.off('change');
  }

  render() {
    return (
      <div>
        <div id="js-codemirror-target"></div>
      </div>
    )
  }
}

Codemirror.propTypes = propTypes;
Codemirror.defaultProps = defaultProps;

export default Codemirror;
