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
      <Route path="settings" element={<SiteSettings />} />
      <Route path="published" element={<PublishedBranchesTable />} />
      <Route path="published/:name" element={<PublishedFilesTable />} />
      <Route path="builds" element={<SiteBuildList />} />
      <Route path="custom-domains" element={<DomainList />} />
      <Route path="custom-domains/new" element={<NewCustomDomain />} />
      <Route path="custom-domains/:domainId/edit" element={<EditCustomDomain />} />
      {process.env.FEATURE_FILE_STORAGE_SERVICE === 'true' && (
        <>
          <Route path="storage" element={<FileStorage />} />
          <Route path="storage/logs" element={<FileStorageLog />} />
        </>
      )}
      <Route path="builds/:buildId/logs" element={<BuildLogs />} />
      <Route path="scans" loader={() => redirect('../reports')} />
      {process.env.FEATURE_BUILD_TASKS === 'active' && (
        <Route path="reports" element={<Reports />} />
      )}
    </Route>
    <Route path="settings" element={<Settings />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
