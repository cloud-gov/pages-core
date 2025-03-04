import React from 'react';
import { useSelector } from 'react-redux';
import { useParams, useLocation, useSearchParams, Outlet } from 'react-router-dom';

import { currentSite } from '@selectors/site';
import { getOrgById } from '@selectors/organization';
import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';

import SideNav from './SideNav';
import PagesHeader from './PagesHeader';

export const SITE_NAVIGATION_CONFIG = [
  {
    display: 'Custom Domains',
    route: 'custom-domains',
    icon: 'IconLink',
  },
  {
    display: 'Build history',
    route: 'builds',
    icon: 'IconBook',
  },
  {
    display: 'Report history',
    route: 'reports',
    icon: 'IconReport',
  },
  {
    display: 'Site settings',
    route: 'settings',
    icon: 'IconGear',
  },
  {
    display: 'Published builds',
    route: 'published',
    icon: 'IconCloudUpload',
  },
];

{
  process.env.FEATURE_FILE_STORAGE_SERVICE === 'true' &&
    SITE_NAVIGATION_CONFIG.push({
      display: 'Public storage',
      route: 'storage',
      icon: 'IconAttachment',
    });
}

export const SITE_TITLE_CONFIG = [
  ...SITE_NAVIGATION_CONFIG,
  {
    display: 'Reports for build #',
    route: 'reports',
  },
  {
    display: 'Logs for build #',
    route: 'logs',
  },
];

function getPageTitle(pathname, buildId = null) {
  const route = pathname.split('/').pop();
  const routeConf = SITE_TITLE_CONFIG.find((conf) => conf.route === route);
  if (routeConf) {
    if (buildId) {
      return routeConf.display + buildId;
    }
    return routeConf.display;
  }
  return '';
}
export function SiteContainer() {
  const { id, buildId } = useParams();
  const location = useLocation();
  const params = useSearchParams();
  const sites = useSelector((state) => state.sites);
  const organizations = useSelector((state) => state.organizations);
  const alert = useSelector((state) => state.alert);

  if (sites.isLoading || !sites.data) {
    return <LoadingIndicator />;
  }

  const site = currentSite(sites, id);

  if (!site) {
    const errorMessage = (
      <span>
        You don&apos;t have access to this site, please contact the site owner if you
        believe this is an error.
      </span>
    );
    return <AlertBanner status="error" header="" message={errorMessage} />;
  }

  if (organizations.isLoading || !organizations.data) {
    return <LoadingIndicator />;
  }

  const org = getOrgById(organizations, site.organizationId);

  if (!site.isActive) {
    const errorMessage = (
      <span>
        You don&apos;t have access to this site because it&apos;s inactive, please contact
        support if you believe this is an error.
      </span>
    );
    return <AlertBanner status="error" header="" message={errorMessage} />;
  }

  if (org && !org.isActive) {
    const errorMessage = (
      <span>
        You don&apos;t have access to this site because it&apos;s organization is
        inactive, please contact support if you believe this is an error.
      </span>
    );
    return <AlertBanner status="error" header="" message={errorMessage} />;
  }

  const pageTitle = getPageTitle(location.pathname, buildId);
  const navConig = SITE_NAVIGATION_CONFIG.filter(
    (navItem) => !(navItem.route === 'reports' && site.SiteBuildTasks.length === 0),
  );

  return (
    <div className="grid-row grid-gap-6 site">
      <SideNav siteId={site.id} config={navConig} />
      <div
        className="tablet:grid-col-9 desktop:grid-col-10 grid-col-12 site-main"
        id="pages-container"
        role="main"
      >
        <AlertBanner message={alert.message} status={alert.status} />
        <PagesHeader
          repository={site.repository}
          owner={site.owner}
          title={pageTitle}
          siteId={site.id}
          branch={params.branch || site.defaultBranch}
          fileName={params.fileName}
        />
        <Outlet />
      </div>
    </div>
  );
}

export default SiteContainer;
