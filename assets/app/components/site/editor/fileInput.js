import React from 'react';
import ReactDOM from 'react-dom';
import siteActions from '../../../actions/siteActions';

const propTypes = {
  // is the OS file dialog is open?
  open: React.PropTypes.bool,
  onFileSelect: React.PropTypes.func.isRequired
};

const MAX_FILE_SIZE = 1024 * 1024 * 5
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
    const file = event.target.files[0];

    // TODO: do we want this file size logic etc to be passed in via props?
    // do we want the parent to handle validation? Should one file input be
    // responsible for multiple file types, and, if so, where does that validation logic live?
    // Maybe just a util file with a fileTypeValdiation object that looks up
    // the type of file and sees if the uploaded file is one that is whitelisted
    // and the size is within filesize limits
    if (file.size <= MAX_FILE_SIZE) {
      this.props.onFileSelect(file);
    } else {
      // TODO: should this component pass either a file or null to the parent
      // component, and let that component trigger the error?
      siteActions.alertError('Please upload an image no larger than 5 mb.');
    }

    event.preventDefault();
  }

  render() {
    return (
      <input type="file" id="asset" name="asset" style={{visibility: "hidden"}}/>
    );
  }
}

FileInput.propTypes = propTypes;

export default FileInput;
