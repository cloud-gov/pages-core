import React from 'react';
import { Route, redirect } from 'react-router-dom';

import App from '@pages/app';
import * as Organizations from '@pages/organizations';
import * as Sites from '@pages/sites';
import * as CustomDomains from '@pages/customDomains';
import * as Settings from '@pages/settings';
import NotFound from '@pages/NotFound';
import Error from '@pages/Error';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';
import organizationActions from './actions/organizationActions';

const { NODE_ENV } = process.env;
let ErrorElement = null;
if (NODE_ENV !== 'development') {
  ErrorElement = <Error />;
}

const fetchInitialData = () => {
  userActions.fetchUser();
  siteActions.fetchSites();
  organizationActions.fetchOrganizations();
};

export default (
  <Route path="/" element={<App onEnter={fetchInitialData} />} errorElement={ErrorElement}>
    <Route path="organizations" element={<Organizations.List />} />
    <Route path="organizations/:id" element={<Organizations.Edit />} />
    <Route path="sites" element={<Sites.List />} />
    <Route path="sites/new" element={<Sites.New />} />
    <Route path="sites/:id" element={<Sites.Wrapper />}>
      <Route path="" loader={() => redirect('builds')} />
      <Route path="settings" element={<Sites.Settings />} />
      <Route path="published" element={<Sites.PublishedBranchesTable />} />
      <Route path="published/:name" element={<Sites.PublishedFilesTable />} />
      <Route path="builds" element={<Sites.Builds />} />
      <Route path="custom-domains" element={<CustomDomains.List />} />
      <Route path="custom-domains/new" element={<CustomDomains.New />} />
      <Route path="custom-domains/:domainId/edit" element={<CustomDomains.Edit />} />
      <Route path="builds/:buildId/logs" element={<Sites.BuildLogs />} />
      <Route path="scans" loader={() => redirect('../reports')} />
      {(process.env.FEATURE_BUILD_TASKS === 'active') && (
        <Route path="reports" element={<Sites.Reports />} />
      )}
    </Route>
    <Route path="settings" element={<Settings.UserSettings />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
