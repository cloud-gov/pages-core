import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

import A11yScanIndex from './A11yScanIndexLayout';
import A11yScanChild from './A11yScanChildLayout';
import Zap from './Zap';
import TypeNotFound from './TypeNotFound';
import * as zapData from '../../data/zap.json';
import * as a11yIndex from '../../data/a11y-index.json';
import * as a11yChild from '../../data/a11y-child.json';

// fake function for now
function useReportData(type, id, subpage) {
  switch (type) {
    case 'zap':
      return zapData;                 // http://localhost:1337/report/zap/zap
    case 'a11y': 
      if (subpage) return a11yChild; // http://localhost:1337/report/a11y/a11y/a11y-child
      return a11yIndex;               // http://localhost:1337/report/a11y/a11y
    default:
      return null;
  }
}

export default function Report() {
  const { type, id, subpage } = useParams();

  const data = useReportData(type, id, subpage);

  if (!data) return <TypeNotFound />;

  switch (type) {
    case 'zap':
      return <Zap data={data} />;
    case 'a11y':
      if (subpage) return <A11yScanChild data={data} />;
      return <A11yScanIndex data={data} />;
    default:
      return <TypeNotFound />;
  }
  
  // return (
  //   <main class="grid-container">

  //   </main>
  // );
}

// Report.propTypes = {
//   id: PropTypes.number.isRequired,
// };
