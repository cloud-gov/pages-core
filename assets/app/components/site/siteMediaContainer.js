
import React from 'react';

import siteActions from '../../actions/siteActions';

import MediaThumbnail from '../MediaThumbnail';

class SiteMediaContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    let assets = this.props.assets;
    let content;

    if (!assets.length) {
      content = <h1>No media uploaded yet.</h1>
    }
    else {
      content = <ul>
        {
          assets.map((asset, index) => {
            return <MediaThumbnail key={index} asset={ asset } />
          })
        }
      </ul>
    }

    return (
      <div>
        <div className="usa-grid">
          { content }
        </div>
      </div>
    )
  }
}

SiteMediaContainer.propTypes = {
  assets: React.PropTypes.array,
  site: React.PropTypes.object,
  viewLink: React.PropTypes.string
};

SiteMediaContainer.defaultProps = {
  assets: []
}

export default SiteMediaContainer;
