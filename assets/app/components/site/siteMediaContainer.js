
import React from 'react';
import siteActions from '../../actions/siteActions';
import MediaThumbnail from '../mediaThumbnail';

class SiteMediaContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    const { assets } = this.props;
    let content;

    if (!assets.length) {
      content = <h1>No media uploaded yet.</h1>
    }
    else {
      content = <div className="media-assets">
        {
          assets.map((asset, index) => {
            return <MediaThumbnail key={ index } asset={ asset } />
          })
        }
      </div>
    }

    return content;
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
