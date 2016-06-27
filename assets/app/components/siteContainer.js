import React from 'react';
import { Link } from 'react-router';

import siteActions from '../actions/siteActions';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';

class SiteContainer extends React.Component {
  constructor(props) {
    super(props);

    const { storeState, params } = props;
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

  // TODO: is this something that should be derived in a reducer and passed
  // down explicitely?
  getCurrentSite(sites, siteId) {
    return sites.filter((site) => {
      // force type coersion
      return site.id == siteId;
    }).shift();
  }

  componentWillReceiveProps() {
    console.log('props!', arguments)
  }

  render () {
    const state = this.props.storeState;
    const children = this.props.children;
    const site = this.getCurrentSite(state.sites, this.props.params.id);
    const pageTitle = this.getPageTitle(this.props.location.pathname);

    let childConfigs;

    // TODO: I dont like the switch in the render method.
    // Ideally we can derive these configs using constants from the name/path
    // of the route we are on. I'm also not crazy about tying these to route paths
    // as it makes it harder to change things.
    switch(pageTitle) {
      case 'media':
        childConfigs = {
          assets: state.assets,
          site
        };
        break;
      case 'logs':
        childConfigs = {
          builds: site.builds,
          repository: site.repository
        };
        break;
      case 'pages':
        console.log('site files!', site.files)
        childConfigs = {
          siteId: site.id,
          branch: site.branch || site.defaultBranch,
          pages: site.files
        };
        break;
      case 'settings':
        childConfigs = {
          site
        };
        break;
      default:
        childConfigs = {};
    }

    return (
      <div className="usa-grid site">
        <div className="usa-width-one-sixth" id="fool">
          <SideNav siteId={site.id} />
        </div>
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <PagesHeader
            repository={site.repository}
            title={pageTitle}
            isPages={pageTitle === 'Pages'}
          />
          {children &&
            React.cloneElement(children, childConfigs)
          }
        </div>
      </div>
    )
  }
}

SiteContainer.propTypes = {
  state: React.PropTypes.object
};

export default SiteContainer;
