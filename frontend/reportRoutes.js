import React from 'react';
import { Route } from 'react-router-dom';

import Report from './pages/Reports';
import ShowReport from './pages/Reports/ShowReport';
import ShowReportSubpage from './pages/Reports/ShowReportSubPage';
import NotFound from './components/NotFound';
import RouterError from './components/RouterError';

export default (
  <Route
    path="/report/"
    element={<Report />}
    errorElement={<RouterError />}
  >
    <Route path=":id" element={<ShowReport />} />
    <Route path=":id/:subpage" element={<ShowReportSubpage />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
