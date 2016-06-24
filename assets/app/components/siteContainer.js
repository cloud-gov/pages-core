import React from 'react';
import { Link } from 'react-router';
import { routeTypes } from '../constants';

import siteActions from '../actions/siteActions';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';
import PagesContainer from './site/pagesContainer';

class SiteContainer extends React.Component {
  constructor(props) {
    super(props);
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

  render () {
    const state = this.props.storeState;
    const children = this.props.children;
    const site = state.sites.filter((site) => {
      // force type coersion
      return site.id == this.props.params.id;
    }).shift();
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
