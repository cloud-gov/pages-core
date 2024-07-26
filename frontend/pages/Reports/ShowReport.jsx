import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

import A11y from './A11y';
import Zap from './Zap';
import TypeNotFound from './TypeNotFound';
import * as zapData from '../../data/zap.json';
import * as a11yIndex from '../../data/a11y.json';
import * as a11ySingle from '../../data/cnn_wcag22aa.json';

// fake function for now
function useReportData(type, id, subpage) {
  switch (type) {
    case 'zap':
      return zapData;
    case 'a11y':
      if (subpage) return a11ySingle;
      return a11yIndex;
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
      return <A11y data={data} />;
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
