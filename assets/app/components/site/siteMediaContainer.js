import React from 'react';
import siteActions from '../../actions/siteActions';
import MediaThumbnail from '../mediaThumbnail';

const propTypes = {
  assets: React.PropTypes.array
};

const SiteMediaContainer = ({assets = []}) => {
  if (!assets.length) {
    return <h1>No media uploaded yet.</h1>;
  }

  return (
    <div className="media-assets">
      {
        assets.map((asset, index) => {
          return <MediaThumbnail key={ index } asset={ asset } />;
        })
      }
    </div>
  );
};

SiteMediaContainer.propTypes = propTypes;

export default SiteMediaContainer;
