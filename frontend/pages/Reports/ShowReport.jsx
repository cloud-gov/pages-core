import React from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import A11yScanIndex from '../../components/Reports/A11yScanIndexLayout';
import A11yScanChild from '../../components/Reports/A11yScanChildLayout';
import Zap from '../../components/Reports/Zap';
import ReportNotFound from '../../components/Reports/ReportNotFound';
// import * as zapData from '../../data/zap.json';
// import * as a11yIndex from '../../data/a11y-index.json';
// import * as a11ySingle from '../../data/a11y-child.json';
import { useReportData } from '../../hooks/useReportData';

// fake function for now
// function useReportData(type, id, subpage) {
//   switch (type) {
//     case 'zap':
//       return zapData;                 // http://localhost:1337/report/zap/zap
//     case 'a11y':
//       if (subpage) return a11ySingle; // http://localhost:1337/report/a11y/a11y/a11y-child
//       return a11yIndex;               // http://localhost:1337/report/a11y/a11y
//     default:
//       return null;
//   }
// }

export default function Report() {
  const { id, subpage } = useParams();

  const { data, isLoading } = useReportData(id, subpage);
  if (isLoading) return <ReportLoading />;
  if (!data) return <ReportNotFound />;
  const { report, siteId, buildId } = data;

  switch (data.type) {
    case 'owasp-zap':
      return <Zap data={report} siteId={siteId} buildId={buildId} />;
    case 'a11y':
      if (subpage) return <A11yScanChild data={report} siteId={siteId} buildId={buildId} />;
      return <A11yScanIndex data={report} siteId={siteId} buildId={buildId} />;
    default:
      return <ReportNotFound />;
  }
}

const ReportLoading = ({ text = 'Please wait...' }) => (
  <div className="usa-prose padding-y-10">
    <h1>Report loading</h1>
    <p className="usa-intro">
      {text}
    </p>
    <div className="loader loader--main">
      <div className="uil-ring-css">
        <div />
      </div>
    </div>
  </div>
);

ReportLoading.propTypes = {
  text: PropTypes.string,
};
