import React from 'react';
import FileInput from './fileInput';
import ImageCard from './imageCard';

const propTypes = {
  assets: React.PropTypes.array,
  handleCancel: React.PropTypes.func.isRequired,
  handleConfirm: React.PropTypes.func.isRequired,
  handleUpload: React.PropTypes.func.isRequired,
  handleConfirm: React.PropTypes.func.isRequired
};

class ImagePicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openDialog: false,
      selected: null
    };

    this.handleSelect = this.handleSelect.bind(this);
    this.handleFileDialog = this.handleFileDialog.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  getImageCards() {
    const { assets } = this.props;
    const { selected } = this.state;

    return assets.map((asset, index) => {
      return (
        <ImageCard
          asset={asset}
          key={index}
          handleSelect={this.handleSelect}
          selected={selected} />
      );
    });
  }

  handleSelect(fileName) {
    this.setState({
      selected: fileName
    });
  }

  handleConfirm() {
    if (this.state.selected) {
      this.props.handleConfirm(this.state.selected);
    }
  }

  handleCancel() {
    this.setState({
      selected: null
    },() => {
      this.props.handleCancel();
    });
  }

  handleFileDialog() {
    this.setState({
      openDialog: true
    });
  }

  render() {
    const { handleUpload } = this.props;

    return (
      <div>
        <div className="usa-alert usa-alert-info upload-alert">
          <div className="panel-heading">Select an image</div>
          <div className="panel-body">
            <div className="image-cards">
              <div className="scroll">
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
                {this.getImageCards()}
              </div>
            </div>

            <div>
              <a className="usa-button usa-button-secondary"
                onClick={this.handleCancel}
                role="button"
              >Cancel</a>
              <a className="usa-button usa-button-primary"
                onClick={this.handleConfirm}
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
