import React from 'react';
import { Route } from 'react-router-dom';

import App from './components/app';
import * as Organization from './components/organization';
import UserSettings from './components/user/Settings';
import SiteList from './components/siteList/siteList';
import SiteContainer from './components/siteContainer';
import SiteBuilds from './components/site/siteBuilds';
import SiteBuildLogs from './components/site/siteBuildLogs';
import SiteUsers from './components/site/SiteUsers';
import SitePublishedBranchesTable from './components/site/sitePublishedBranchesTable';
import SitePublishedFilesTable from './components/site/SitePublishedFilesTable';
import SiteSettings from './components/site/SiteSettings';
import AddSite from './components/AddSite';
import NotFound from './components/NotFound';
import Error from './components/Error';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';
import organizationActions from './actions/organizationActions';

import globals from './globals';

const isPages = globals.PRODUCT === 'pages';

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
  <Route path="/" loader={fetchInitialData} element={<App />} errorElement={ErrorElement}>
    {isPages && <Route path="organizations" element={<Organization.List />} />}
    {isPages && <Route path="organizations" element={<Organization.Edit />} />}
    <Route path="sites" element={<SiteList />} />
    {isPages && <Route path="sites/new" element={<AddSite />} /> }
    <Route path="sites/:id" element={<SiteContainer />}>
      {/* <Redirect noThrow from="/" to="builds" /> */}
      <Route path="settings" element={<SiteSettings />} />
      <Route path="published" element={<SitePublishedBranchesTable />} />
      <Route path="published/:name" element={<SitePublishedFilesTable />} />
      <Route path="builds" element={<SiteBuilds />} />
      <Route path="builds/:buildId/logs" element={<SiteBuildLogs />} />
      <Route path="users" element={<SiteUsers />} />
    </Route>
    <Route path="settings" element={<UserSettings />} />
    {/* <Redirect noThrow from="*" to="/not-found" /> */}
    <Route path="/*" element={<NotFound />} />
    {/* <Redirect noThrow from="*" to="/sites" /> */}
  </Route>
);
