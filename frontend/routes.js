import React from 'react';
import { Route, redirect } from 'react-router-dom';

// TODO: we're currently mimicking a file based router using a component based router
import App from '@pages/app';
import OrganizationList from '@pages/organizations';
import OrganizationEdit from '@pages/organizations/edit';
import Sites from '@pages/sites';
import AddSite from '@pages/sites/new';
import SiteContainer from '@pages/sites/$siteId';
import Settings from '@pages/settings';
import NotFound from '@pages/NotFound';
import ErrorMessage from '@pages/ErrorMessage';

import siteRoutes from '@pages/sites/$siteId/siteRoutes';
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
      {siteRoutes.map((route) => (
        <Route key={route.title} path={route.path} Component={route.Component} />
      ))}
    </Route>
    <Route path="settings" element={<Settings />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
