import React from 'react';
import { Route } from 'react-router-dom';

import Report from './pages/Reports';
import ShowReport from './pages/Reports/ShowReport';
import NotFound from './components/NotFound';
// import Error from './components/Error';

export default (
  <Route
    path="/report/"
    element={<Report />}
    errorElement={<NotFound />}
  >
    <Route path=":id" element={<ShowReport />} />
    <Route path=":id/:subpage" element={<ShowReport />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
