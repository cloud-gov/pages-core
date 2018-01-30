import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SideNav from './site/SideNav';
import PagesHeader from './site/pagesHeader';
import AlertBanner from './alertBanner';
import LoadingIndicator from './LoadingIndicator';

const propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string,
    branch: PropTypes.string,
    fileName: PropTypes.string,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  sites: PropTypes.object,
  alert: PropTypes.object,
};

const defaultProps = {
  children: null,
  sites: null,
  alert: {},
};

export const SITE_NAVIGATION_CONFIG = [
  {
    display: 'Build history',
    route: 'builds',
    icon: 'icon-book',
  },
  {
    display: 'GitHub branches',
    route: 'branches',
    icon: 'icon-branch',
  },
  {
    display: 'Published files',
    route: 'published',
    icon: 'icon-cloud_upload',
  },
  {
    display: 'Collaborators',
    route: 'users',
    icon: 'icon-people',
  },
  {
    display: 'Site settings',
    route: 'settings',
    icon: 'icon-gear',
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

  getCurrentSite(sitesState, siteId) {
    if (sitesState.isLoading) {
      return null;
    }

    return sitesState.data.find(site => site.id === parseInt(siteId, 10));
  }

  render() {
    const { sites, children, params, location, alert } = this.props;

    if (sites.isLoading || !sites.data) {
      return <LoadingIndicator />;
    }

    const site = this.getCurrentSite(sites, params.id);

    if (!site) {
      const errorMessage = (
        <span>
          Apologies; you don&apos;t have access to this site in Federalist!
          <br />
          Please contact the site owner if you should have access.
        </span>
      );
      return (
        <AlertBanner
          status="error"
          header="Unavailable"
          message={errorMessage}
        />
      );
    }

    const pageTitle = this.getPageTitle(location.pathname);

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
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
          <div className="">
            {children && React.cloneElement(children, { site })}
          </div>
        </div>
      </div>
    );
  }
}

SiteContainer.propTypes = propTypes;
SiteContainer.defaultProps = defaultProps;

export default connect(state => state)(SiteContainer);
