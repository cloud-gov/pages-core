import React from 'react';
import { Link } from 'react-router';

import { replaceHistory } from '../actions/routeActions';
import siteActions from '../actions/siteActions';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';
import AlertBanner from './alertBanner';

import { getDraft } from '../util/branchFormatter';

const propTypes = {
  storeState: React.PropTypes.object,
  params: React.PropTypes.object //{id, branch, splat, fileName}
};

class SiteContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { storeState } = this.props;
    if (storeState.sites.length) {
      this.downloadCurrentSiteData();
    }
  }

  componentDidUpdate(prevProps) {
    const { storeState } = this.props;
    const prevStoreState = prevProps.storeState;

    if (storeState.sites.length && !prevStoreState.sites.length) {
      this.downloadCurrentSiteData();
    }
  }

  downloadCurrentSiteData() {
    const { storeState, params } = this.props;
    const currentSite = this.getCurrentSite(storeState.sites, params.id);

    if (currentSite) {
      siteActions.fetchSiteConfigsAndAssets(currentSite);
    } else {
      replaceHistory('/sites');
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

    // I'm not crazy about tying these to route paths
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
    }

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <AlertBanner
            message={storeState.alert.message}
            status={storeState.alert.status}/>
          <PagesHeader
            repository={site.repository}
            owner={site.owner}
            title={pageTitle}
            isPages={this.isPages(location.pathname)}
            siteId={site.id}
            branch={params.branch || site.defaultBranch}
            fileName={params.fileName}
            viewLink={site.viewLink}
          />
          <div className="usa-grid">
            {children &&
              React.cloneElement(children, childConfigs)
            }
          </div>
        </div>
      </div>
    );
  }
}

SiteContainer.propTypes = propTypes;

export default SiteContainer;
