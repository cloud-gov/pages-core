
import React from 'react';

import siteActions from '../actions/siteActions';

import MediaThumbnail from './MediaThumbnail';

class SiteMediaContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    let assets = this.props.assets;
    let content;

    if (assets.length === 0) {
      content = <h1>No media uploaded yet.</h1>
    }
    else {
      content = <ul>
        {
          assets.map((asset) => {
            return <MediaThumbnail asset={ asset } />
          })
        }
      </ul>
    }

    return (
      <div>
        <div className="usa-grid header">
          <div className="usa-width-two-thirds">
            <img className="header-icon" src="/images/website.svg" alt="Websites icon" />
            <div className="header-title">
              <h1>{ this.props.site.repository }</h1>
              <p>Media</p>
            </div>
          </div>
          <div className="usa-width-one-third">
            <a className="usa-button usa-button-big pull-right icon icon-view icon-white"
                href={ this.props.viewLink } alt="View this website" role="button"
                target="_blank">
                View Website
            </a>
          </div>
        </div>
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
