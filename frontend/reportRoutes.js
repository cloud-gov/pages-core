import React from 'react';
import { Route } from 'react-router-dom';

import Report from '@pages/reports';
import ShowReport from '@pages/reports/ShowReport';
import ShowReportSubpage from '@pages/reports/ShowReportSubPage';
import RouterError from '@pages/reports/RouterError';
import NotFound from '@pages/NotFound';

export default (
  <Route path="/report/" element={<Report />} errorElement={<RouterError />}>
    <Route path=":id" element={<ShowReport />} />
    <Route path=":id/:subpage" element={<ShowReportSubpage />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);
