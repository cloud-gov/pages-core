import React from 'react';
import PropTypes from 'prop-types';

import scanActions from '../../actions/scanActions';

class ScanUpload extends React.Component {
  constructor(props) {
    super(props);
    this.selectedFile = null;

    this.onChangeHandler = this.onChangeHandler.bind(this);
    this.onClickHandler = this.onClickHandler.bind(this);
  }

  onChangeHandler = (event) => {
    
    // this.setState({
    //   selectedFile: event.target.files[0],
    //   loaded: 0,
    // });
    this.selectedFile = event.target.files[0];
    console.log('1')
    console.log(event.target.files[0]);
    console.log('2')
    console.log(`\n\nthis.selectedFile:\t${this.selectedFile.name}`)
    console.log('3')
  }

  onClickHandler = () => {
    console.log(`\n\nonClickHandler:\t${this.selectedFile}\n\n`);
    const data = new FormData();
    data.append('file', this.selectedFile, this.selectedFile.name);
    console.log(`\n\nonClickHandler-data:\t${data.values}\n\n`);
    scanActions.upload(data);
  }

  render() {
    return (
      <div>
        <input type="file" name="file" onChange={this.onChangeHandler} />
        <button type="button" className="btn btn-success btn-block" onClick={this.onClickHandler}>Upload</button>
      </div>
    );
  }
}

ScanUpload.propTypes = {
  handlerParams: PropTypes.object,
  onChangeHandler: PropTypes.func.isRequired,
};

ScanUpload.defaultProps = {
};

export default ScanUpload ;
