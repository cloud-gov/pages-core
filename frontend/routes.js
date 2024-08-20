import React from 'react';
import { Route, redirect } from 'react-router-dom';

import App from './components/app';
import * as Organization from './components/organization';
import UserSettings from './components/user/Settings';
import SiteList from './components/siteList/siteList';
import SiteContainer from './components/siteContainer';
import SiteBuilds from './components/site/siteBuilds';
import SiteBuildLogs from './components/site/siteBuildLogs';
import SitePublishedBranchesTable from './components/site/sitePublishedBranchesTable';
import SitePublishedFilesTable from './components/site/SitePublishedFilesTable';
import SiteSettings from './components/site/SiteSettings';
import CustomDomains from './components/site/CustomDomains';
import NewCustomDomain from './components/site/CustomDomains/New';
import EditCustomDomain from './components/site/CustomDomains/Edit';
import SiteReports from './components/site/SiteReports';
import AddSite from './components/AddSite';
import NotFound from './components/NotFound';
import Error from './components/Error';

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
    <Route path="organizations" element={<Organization.List />} />
    <Route path="organizations/:id" element={<Organization.Edit />} />
    <Route path="sites" element={<SiteList />} />
    <Route path="sites/new" element={<AddSite />} />
    <Route path="sites/:id" element={<SiteContainer />}>
      <Route path="" loader={() => redirect('builds')} />
      <Route path="settings" element={<SiteSettings />} />
      <Route path="published" element={<SitePublishedBranchesTable />} />
      <Route path="published/:name" element={<SitePublishedFilesTable />} />
      <Route path="builds" element={<SiteBuilds />} />
      <Route path="custom-domains" element={<CustomDomains />} />
      <Route path="custom-domains/new" element={<NewCustomDomain />} />
      <Route path="custom-domains/:domainId/edit" element={<EditCustomDomain />} />
      <Route path="builds/:buildId/logs" element={<SiteBuildLogs />} />
      <Route path="scans" loader={() => redirect('../reports')} />
      {(process.env.FEATURE_BUILD_TASKS === 'active') && (
        <Route path="reports" element={<SiteReports />} />
      )}
    </Route>
    <Route path="settings" element={<UserSettings />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
