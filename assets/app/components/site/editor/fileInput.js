import React from 'react';
import ReactDOM from 'react-dom';

const propTypes = {
  open: React.PropTypes.bool,
  onFileSelect: React.PropTypes.func.isRequired
};

const EVENT_TYPE = 'change';

class FileInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    ReactDOM.findDOMNode(this).addEventListener(EVENT_TYPE, this.handleChange);
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this).removeEventListener(EVENT_TYPE, this.handleChange);
  }

  componentDidUpdate() {
    if (this.props.open) {
      ReactDOM.findDOMNode(this).click();
    }
  }

  handleChange(event) {
    event.preventDefault();

    this.props.onFileSelect(event.target.files[0]);
  }

  render() {
    return (
      <input type="file" id="asset" name="asset" style={{visibility: "hidden"}}/>
    );
  }
}

FileInput.propTypes = propTypes;

export default FileInput;
