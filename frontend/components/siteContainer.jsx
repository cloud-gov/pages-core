import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ALERT, SITE } from '../propTypes';
import { currentSite } from '../selectors/site';
import SideNav from './site/SideNav';
import PagesHeader from './site/PagesHeader';
import AlertBanner from './alertBanner';
import LoadingIndicator from './LoadingIndicator';

export const SITE_NAVIGATION_CONFIG = [
  {
    display: 'Build history',
    route: 'builds',
    icon: 'IconBook',
  },
  {
    display: 'Uploaded files',
    route: 'published',
    icon: 'IconCloudUpload',
  },
  {
    display: 'Collaborators',
    route: 'users',
    icon: 'IconPeople',
  },
  {
    display: 'Site settings',
    route: 'settings',
    icon: 'IconGear',
  },
  {
    display: 'Notifications',
    route: 'notifications',
    icon: 'IconEnvelope',
  },
];

export class SiteContainer extends React.Component {
  getPageTitle(pathname) {
    const route = pathname.split('/').pop();
    const routeConf = SITE_NAVIGATION_CONFIG.find(conf => conf.route === route);
    if (routeConf) {
      return routeConf.display;
    }
    return '';
  }

  render() {
    const {
      id, sites, children, params, location, alert,
    } = this.props;

    if (sites.isLoading || !sites.data) {
      return <LoadingIndicator />;
    }

    const site = currentSite(sites, id);

    if (!site) {
      const errorMessage = (
        <span>
          You don&apos;t have access to this site,
          please contact the site owner if you believe this is an error.
        </span>
      );
      return (
        <AlertBanner
          status="error"
          header=""
          message={errorMessage}
        />
      );
    }

    const pageTitle = this.getPageTitle(location.pathname);

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} config={SITE_NAVIGATION_CONFIG} />
        <div className="usa-width-five-sixths site-main" id="pages-container">

          <AlertBanner
            message={alert.message}
            status={alert.status}
          />

          <PagesHeader
            repository={site.repository}
            owner={site.owner}
            title={pageTitle}
            siteId={site.id}
            branch={params.branch || site.defaultBranch}
            fileName={params.fileName}
            viewLink={site.viewLink}
          />

          {children}

        </div>
      </div>
    );
  }
}

SiteContainer.propTypes = {
  id: PropTypes.string.isRequired,
  params: PropTypes.shape({
    branch: PropTypes.string,
    fileName: PropTypes.string,
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  sites: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(SITE),
  }),
  alert: ALERT,
};

SiteContainer.defaultProps = {
  children: null,
  sites: {
    isLoading: false,
    data: [],
  },
  alert: {},
  params: {},
};

export default connect(state => state)(SiteContainer);
