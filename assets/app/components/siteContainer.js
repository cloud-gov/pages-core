import React from 'react';
import { Link, withRouter } from 'react-router';

import siteActions from '../actions/siteActions';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';
import AlertBanner from './alertBanner';

const propTypes = {
  storeState: React.PropTypes.object
};

class SiteContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { storeState, params, routeParams } = this.props;
    const currentSite = this.getCurrentSite(storeState.sites, params.id);

    if (!currentSite) {
      this.props.router.push('/sites');
    } else {
      siteActions.fetchSiteConfigsAndAssets(currentSite);
    }
  }

  getPageTitle(pathname) {
    const currentPath = pathname.split('/').pop();

    // If the currentPath has only 'tree' as it's last parameter,
    // we can safely return 'pages' as the title.
    return currentPath === 'tree' ? 'pages' : currentPath;
  }

  isPages(path) {
    return path.indexOf('tree') !== -1;
  }

  getCurrentSite(sites, siteId) {
    return sites.find((site) => {
      // force type coersion
      return site.id == siteId;
    });
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

    if (!site) {
      return null;
    }else if (!site.branches) {return null;}

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <AlertBanner
            message={storeState.alert.message}
            status={storeState.alert.status}/>
          <PagesHeader
            repository={site.repository}
            title={pageTitle}
            isPages={this.isPages(location.pathname)}
            siteId={site.id}
            branch={site.defaultBranch}
            fileName={params.fileName}
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

export default withRouter(SiteContainer);
