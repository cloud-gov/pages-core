
import React from 'react';

import siteActions from '../../actions/siteActions';

class PagesContainer extends React.Component {
  constructor(props) {
    super(props);
    siteActions.fetchSiteConfigsAndAssets(this.props.site);
  }

  render () {
    let site = this.props.site;
    let navigationJson = site['_navigation.json'] || {};
    return (
      <div>
        <div className="usa-grid">
          <h1>Yo</h1>
          <code>{ JSON.stringify(navigationJson) }</code>
        </div>
      </div>
    )
  }
}

PagesContainer.propTypes = {
  site: React.PropTypes.object
};

export default PagesContainer;
