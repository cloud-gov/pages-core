
import React from 'react';
import codemirror from 'codemirror';

const propTypes = {
  initialFrontmatterContent: React.PropTypes.string
};

const defaultProps = {
  initialFrontmatterContent: ''
};

class Codemirror extends React.Component {
  componentDidMount() {
    const target = document.querySelector('#js-codemirror-target');
    this.editor = codemirror(target, {
      lineNumbers: true,
      mode: 'yaml',
      value: this.props.initialFrontmatterContent
    });

    this.editor.on('change', (event) => {
      console.log('change event from codemirror', event);
    });
  }

  componentDidUpdate() {
    this.editor.setValue(this.props.initialFrontmatterContent);
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
