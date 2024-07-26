import React from 'react';
import { Route } from 'react-router-dom';

import Report from './pages/Reports';
import ShowReport from './pages/Reports/ShowReport';
import NotFound from './components/NotFound';
// import Error from './components/Error';

// import siteActions from './actions/siteActions';
// import userActions from './actions/userActions';
// import organizationActions from './actions/organizationActions';

// const fetchInitialData = () => {
//   userActions.fetchUser();
//   siteActions.fetchSites();
//   organizationActions.fetchOrganizations();
// };

export default (
  <Route
    path="/report/"
    element={<Report />}
    errorElement={<NotFound />}
  >
    <Route path=":type/:id" element={<ShowReport />} />
    <Route path=":type/:id/:subpage" element={<ShowReport />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
