import React from 'react';
import { useSelector } from 'react-redux';
import {
  matchPath,
  useParams,
  useLocation,
  useSearchParams,
  Outlet,
} from 'react-router-dom';

import { currentSite } from '@selectors/site';
import { getOrgById } from '@selectors/organization';
import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';
import siteRoutes from './siteRoutes';

import SideNav from './SideNav';
import PagesHeader from './PagesHeader';

export const SITE_NAVIGATION_CONFIG = siteRoutes.filter((route) => route.showInSidebar);

function getPageTitle(location, buildId = null) {
  const matchingRoute = siteRoutes.find((route) =>
    matchPath('sites/:id/' + route.path, location.pathname),
  );
  if (matchingRoute) {
    if (buildId) {
      return matchingRoute.title + buildId;
    }
    return matchingRoute.title;
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

  const pageTitle = getPageTitle(location, buildId);
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
