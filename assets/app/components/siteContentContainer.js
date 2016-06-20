
import React from 'react';

import siteActions from '../actions/siteActions';

class SiteContentContainer extends React.Component {
  constructor(props) {
    super(props);
    siteActions.fetchSiteConfigsAndAssets(this.props.site);
  }

  render () {
    let site = this.props.site;
    let navigationJson = site['_navigation.json'] || {};
    return (
      <div>
        <div className="usa-grid header">
          <div className="usa-width-two-thirds">
            <img className="header-icon" src="/images/website.svg" alt="Websites icon" />
            <div className="header-title">
              <h1>{ this.props.site.repository }</h1>
              <p>Pages</p>
            </div>
          </div>
          <div className="usa-width-one-third">
            <a className="usa-button usa-button-big pull-right icon icon-view icon-white"
                href="" alt="Add a new page" role="button">Add a new page</a>
          </div>
        </div>
        <div className="usa-grid">
          <h1>Yo</h1>
          <code>{ JSON.stringify(navigationJson) }</code>
        </div>
      </div>
    )
  }
}

SiteContentContainer.propTypes = {
  site: React.PropTypes.object
};

export default SiteContentContainer;
