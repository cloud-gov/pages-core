import React from 'react';

import { routeTypes } from '../constants';

import siteActions from '../actions/siteActions';

import SiteContentContainer from './siteContentContainer';
import SiteLogs from './siteLogs';
import SiteMediaContainer from './siteMediaContainer';
import SiteSettings from './siteSettings';


class SiteContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  getUrl(id, path='') {
    return `#/sites/${id}/${path}`;
  }

  getViewLink(site) {
    return `fake-view-site-link-for-site-${site.id}`;
  }

  render () {
    let state = this.props.state;
    let navigation = state.navigation;
    let site =  state.sites.filter((site) => {
      return site.id === navigation.options.id;
    }).pop();
    let assets = state.assets.filter((asset) => {
      return asset.site === navigation.options.id;
    });

    let vl = this.getViewLink(site);
    let content;

    switch (navigation.name) {
      case routeTypes.SITE:
        content = <SiteContentContainer site={ site } />
        break;
      case routeTypes.SITE_LOGS:
        content = <SiteLogs builds={ site.builds } repository={ site.repository } viewLink={ vl } />
        break;
      case routeTypes.SITE_MEDIA:
        content = <SiteMediaContainer assets={ assets } site={ site } viewLink={ vl } />
        break;
      case routeTypes.SITE_SETTINGS:
        content = <SiteSettings site={ site } viewLink={ vl } />
        break;
      default:
        break;
    }

    return (
      <div className="usa-grid site">
        <div className="usa-width-one-sixth" id="fool">
          <ul className="site-actions">
            <li>
              <a className="icon icon-pages" href={ this.getUrl(site.id) }>
                Pages
              </a>
            </li>
            <li>
              <a className="icon icon-media" href={ this.getUrl(site.id, 'media') }>
                Media
              </a>
            </li>
            <li>
              <a className="icon icon-settings" href={ this.getUrl(site.id, 'settings') }>
                Settings
              </a>
            </li>
            <li>
              <a className="icon icon-logs" href={ this.getUrl(site.id, 'logs') }>
                Logs
              </a>
            </li>
          </ul>
        </div>
        <div className="usa-width-five-sixths site-main" id="pages-container">
          { content }
        </div>
      </div>
    )
  }
}

SiteContainer.propTypes = {
  state: React.PropTypes.object
};

export default SiteContainer;
