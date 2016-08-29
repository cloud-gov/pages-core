import React from 'react';

const propTypes = {
  asset: React.PropTypes.object
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'png'];

const emitContentTag = (asset) => {
  if (hasImageExtension(asset.name)) {
    return <img src={ asset.download_url }/>;
  }
  
  return <p>Content can be found at { asset.download_url }</p>;
};

const hasImageExtension = (assetName) => {
  let assetExtension = assetName.split('.').pop();
  return IMAGE_EXTENSIONS.indexOf(assetExtension) !== -1;
};

const MediaThumbnail = ({ asset }) => {  
  return (
    <div className="thumbnail">
      { emitContentTag(asset) }
    </div>
  );
};

MediaThumbnail.propTypes = propTypes;

export default MediaThumbnail;
