import React from 'react';
import { Route, redirect } from 'react-router-dom';

// TODO: we're currently mimicking a file based router using a component based router
import App from '@pages/app';
import OrganizationList from '@pages/organizations';
import OrganizationEdit from '@pages/organizations/edit';
import Sites from '@pages/sites';
import AddSite from '@pages/sites/new';
import SiteContainer from '@pages/sites/$siteId';
import SiteSettings from '@pages/sites/$siteId/settings';
import SiteBuildList from '@pages/sites/$siteId/builds';
import BuildLogs from '@pages/sites/$siteId/builds/$buildId/logs';
import PublishedBranchesTable from '@pages/sites/$siteId/published';
import PublishedFilesTable from '@pages/sites/$siteId/published/$name';
import DomainList from '@pages/sites/$siteId/custom-domains';
import NewCustomDomain from '@pages/sites/$siteId/custom-domains/new';
import EditCustomDomain from '@pages/sites/$siteId/custom-domains/$domainId/edit';
import Reports from '@pages/sites/$siteId/reports';
import FileStorage from '@pages/sites/$siteId/storage';
import FileStorageLog from '@pages/sites/$siteId/storage/logs';
import Settings from '@pages/settings';
import NotFound from '@pages/NotFound';
import ErrorMessage from '@pages/ErrorMessage';

import siteNav from '@pages/sites/$siteId/siteNav';
import siteActions from './actions/siteActions';
import userActions from './actions/userActions';
import organizationActions from './actions/organizationActions';

const { NODE_ENV } = process.env;
let ErrorElement = null;
if (NODE_ENV !== 'development') {
  ErrorElement = <ErrorMessage />;
}

const fetchInitialData = () => {
  userActions.fetchUser();
  siteActions.fetchSites();
  organizationActions.fetchOrganizations();
};

export default (
  <Route
    path="/"
    element={<App onEnter={fetchInitialData} />}
    errorElement={ErrorElement}
  >
    <Route path="organizations" element={<OrganizationList />} />
    <Route path="organizations/:id" element={<OrganizationEdit />} />
    <Route path="sites" element={<Sites />} />
    <Route path="sites/new" element={<AddSite />} />
    <Route path="sites/:id" element={<SiteContainer />}>
      <Route path="" loader={() => redirect('builds')} />
      <Route path={siteNav.SiteSettings.path} element={<SiteSettings />} />
      <Route path={siteNav.PublishedBranches.path} element={<PublishedBranchesTable />} />
      <Route path={siteNav.PublishedFiles.path} element={<PublishedFilesTable />} />
      <Route path={siteNav.SiteBuildList.path} element={<SiteBuildList />} />
      <Route path={siteNav.DomainList.path} element={<DomainList />} />
      <Route path={siteNav.NewCustomDomain.path} element={<NewCustomDomain />} />
      <Route path={siteNav.EditCustomDomain.path} element={<EditCustomDomain />} />
      {process.env.FEATURE_FILE_STORAGE_SERVICE === 'true' && (
        <>
          <Route path={siteNav.FileStorage.path} element={<FileStorage />} />
          <Route path={siteNav.FileStorageLog.path} element={<FileStorageLog />} />
        </>
      )}
      <Route path={siteNav.BuildLogs.path} element={<BuildLogs />} />
      <Route path="scans" loader={() => redirect('../reports')} />
      {process.env.FEATURE_BUILD_TASKS === 'active' && (
        <Route path={siteNav.Reports.path} element={<Reports />} />
      )}
    </Route>
    <Route path="settings" element={<Settings />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
