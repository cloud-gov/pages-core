
import React from 'react';
import codemirror from 'codemirror';

const propTypes = {
  initialYmlContent: React.PropTypes.string
};

const defaultProps = {
  initialYmlContent: ''
};

class Codemirror extends React.Component {
  componentDidMount() {
    const target = document.querySelector('#js-codemirror-target');
    this.editor = codemirror(target, {
      lineNumbers: true,
      mode: 'yaml',
      value: this.props.initialYmlContent
    });

    this.editor.on('change', (event) => {
      console.log('change event from codemirror', event);
    });
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
