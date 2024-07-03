import React from 'react';
import { Route, redirect } from 'react-router-dom';

import Report from './pages/Reports';
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
  <Route path="/tasks/" element={<Report onEnter={fetchInitialData} />} errorElement={ErrorElement}>
    <Route path="/zap" element={<Report.Zap />} />
    <Route path="/a11y" element={<Report.A11y />}>
      <Route path="/a11y/:id" element={<Report.A11y />}>
    </Route>
  </Route>
);
