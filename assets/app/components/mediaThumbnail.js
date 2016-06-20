
import React from 'react';

class MediaThumbnail extends React.Component {
  constructor(props) {
    super(props);
  }

  isImage(assetName) {
    let imageFileExtensions = ['jpg', 'jpeg', 'gif', 'png'];
    let assetExtension = assetName.split('.')[1];

    console.log('assetExtension', assetExtension);

    if (imageFileExtensions.indexOf(assetExtension) > 0) {
      return true;
    }

    return false;
  }

  render () {
    let asset = this.props.asset;
    let content;

    if (this.isImage(asset.name)) {
      content = <img src={ asset.download_url } />
    }
    else {
      content = <p>Content can be found at { asset.download_url }</p>
    }

    return (
      <li key={ asset.url }>
        { content }
      </li>
    )
  }
}

MediaThumbnail.propTypes = {
  asset: React.PropTypes.object
};

export default MediaThumbnail;
