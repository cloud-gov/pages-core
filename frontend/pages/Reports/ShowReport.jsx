import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import AlertBanner from '../../components/Reports/AlertBanner';

import A11y from './A11y';
import Zap from './Zap';
import TypeNotFound from './TypeNotFound';

export default function Report(props) {
  const location = useLocation();
  const { type, id } = useParams();

  return <TypeNotFound />;

  // return (
  //   <main class="grid-container">

  //   </main>
  // );
}

// Report.propTypes = {
//   id: PropTypes.number.isRequired,
// };
