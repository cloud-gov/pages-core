import React from 'react';
import { Link } from 'react-router';

import siteActions from '../actions/siteActions';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';

const propTypes = {
  storeState: React.PropTypes.object
};

class SiteContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { storeState, params } = this.props;
    const currentSite = this.getCurrentSite(storeState.sites, params.id);

    siteActions.fetchSiteConfigsAndAssets(currentSite);
  }

  getPageTitle(pathname) {
    const currentPath = pathname.split('/').pop();
    const isPathSiteId = /^[0-9]+$/;

    // If the currentPath is only a site ID, we can safely return 'Pages' as
    // the title.
    // TODO: this might change as we incorporate the editor view, title might
    // be derived higher on the props chain.
    return isPathSiteId.test(currentPath) ? 'pages' : currentPath;
  }

  getCurrentSite(sites, siteId) {
    return sites.filter((site) => {
      // force type coersion
      return site.id == siteId;
    }).shift();
  }

  render () {
    const { storeState, children, params, location } = this.props;
    const site = this.getCurrentSite(storeState.sites, params.id);
    const pageTitle = this.getPageTitle(location.pathname);

    let childConfigs;

    // TODO: I dont like the switch in the render method.
    // Ideally we can derive these configs using constants from the name/path
    // of the route we are on. I'm also not crazy about tying these to route paths
    // as it makes it harder to change things.
    switch(pageTitle) {
      case 'media':
        childConfigs = {
          assets: storeState.assets,
          site
        };
        break;
      case 'settings':
      case 'pages':
      case 'logs':
      default:
        childConfigs = { site };
    }

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <PagesHeader
            repository={site.repository}
            title={pageTitle}
            isPages={pageTitle === 'Pages'}
          />
          <div className="usa-grid">
            {children &&
              React.cloneElement(children, childConfigs)
            }
          </div>
        </div>
      </div>
    )
  }
}

SiteContainer.propTypes = propTypes;

export default SiteContainer;
