import React from 'react';

const propTypes = {
  asset: React.PropTypes.object
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'png'];

const isImage = (assetName) => {
  let assetExtension = assetName.split('.').pop();
  return IMAGE_EXTENSIONS.indexOf(assetExtension) !== -1;
};

const MediaThumbnail = ({ asset }) => {
  let content;
  
  if (isImage(asset.name)) {
    content = <img src={ asset.download_url }/>;
  }
  else {
    content = <p>Content can be found at { asset.download_url }</p>;
  }
  
  return (
    <div className="thumbnail">
      { content }
    </div>
  );
};

MediaThumbnail.propTypes = propTypes;

export default MediaThumbnail;
