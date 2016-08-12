import React from 'react';
import FileInput from './fileInput';

const propTypes = {
  assets: React.PropTypes.array,
  handleCancel: React.PropTypes.func.isRequired,
  handleConfirm: React.PropTypes.func.isRequired,
  handleUpload: React.PropTypes.func.isRequired
};

class ImagePicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openDialog: false
    };

    this.handleFileDialog = this.handleFileDialog.bind(this);
  }

  handleFileDialog() {
    this.setState({
      openDialog: true
    });
  }

  render() {
    const {
      assets,
      handleCancel,
      handleConfirm,
      handleUpload } = this.props;

    return (
      <div>
        <div className="usa-alert usa-alert-info upload-alert">
          <div className="panel-heading">Select an image</div>
          <div className="panel-body">
            <div className="image-cards">
              <div className="image-card">
                <a className="usa-button"
                  onClick={this.handleFileDialog}
                >Upload a new image</a>
                <label htmlFor="file" style={{visibility: "hidden"}}>
                  Upload a new file from your computer.
                </label>
                <FileInput
                  open={this.state.openDialog}
                  onFileSelect={handleUpload}
                />
                <input type="file" id="asset" name="asset" style={{visibility: "hidden"}}/>
              </div>
            </div>

            <div>
              <a className="usa-button usa-button-secondary"
                onClick={handleCancel}
                role="button"
              >Cancel</a>
              <a className="usa-button usa-button-primary"
                onClick={handleConfirm}
                role="button"
              >Use Image</a>
              <span className="usa-label" id="upload-status-result" style={{display: "none"}}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ImagePicker.propTypes = propTypes;

export default ImagePicker;
