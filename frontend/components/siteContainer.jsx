import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  useParams, useLocation, useSearchParams, Outlet,
} from 'react-router-dom';

import { ALERT, ORGANIZATION, SITE } from '../propTypes';
import { currentSite } from '../selectors/site';
import { getOrgById } from '../selectors/organization';
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
];

function getPageTitle(pathname) {
  const route = pathname.split('/').pop();
  const routeConf = SITE_NAVIGATION_CONFIG.find(conf => conf.route === route);
  if (routeConf) {
    return routeConf.display;
  }
  return '';
}

export function SiteContainer(props) {
  const {
    sites, organizations, alert,
  } = props;
  const { id } = useParams();
  const location = useLocation();
  const params = useSearchParams();

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

  if (organizations.isLoading || !organizations.data) {
    return <LoadingIndicator />;
  }

  if (!site.isActive) {
    const errorMessage = (
      <span>
        You don&apos;t have access to this site because it&apos;s inactive,
        please contact support if you believe this is an error.
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

  const org = site.organizationId ? getOrgById(organizations, site.organizationId) : null;
  if (org && !org.isActive) {
    const errorMessage = (
      <span>
        You don&apos;t have access to this site because it&apos;s organization is inactive,
        please contact support if you believe this is an error.
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

  const pageTitle = getPageTitle(location.pathname);

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

        <Outlet />

      </div>
    </div>
  );
}

SiteContainer.propTypes = {
  sites: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(SITE),
  }),
  organizations: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(ORGANIZATION),
  }),
  alert: ALERT,
};

SiteContainer.defaultProps = {
  sites: {
    isLoading: false,
    data: [],
  },
  organizations: {
    isLoading: false,
    data: [],
  },
  alert: {},
};

export default connect(state => state)(SiteContainer);
