import React from 'react';
import PropTypes from 'prop-types';

import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner, IconX,
} from './icons';

const scanResultsIcon = (status, count) => {
  let icon;
  let results;
  switch (status) {
    case 'error':
      results = 'Scan failed';
      icon = IconX;
      break;
    // this case should never happen, unless we want to show cancelled scans
    case 'cancelled':
      results = 'Not scanned';
      icon = IconX;
      break;
    case 'processing':
      results = 'Scanning';
      icon = IconSpinner;
      break;
    case 'queued':
    case 'created':
      results = 'Scan queued';
      icon = IconClock;
      break;
    case 'success':
      if (count === 1) {
        icon = IconExclamationCircle;
        results = '1 issue';
      } else if (count > 1) {
        icon = IconExclamationCircle;
        results = `${count} issues`;
      } else {
        icon = IconCheckCircle;
        results = 'No issues';
      }
      break;
    default:
      icon = null;
  }
  return { icon, results };
};




export const ScanResultsSummary = (props) => {
  const {status, count, children } = props;
  const { icon, results } = scanResultsIcon(status, count);
  
  return (
    <div className="scan-status">
      { icon && (
        <span className="scan-status_icon">
          { React.createElement(icon) }
        </span>
      )}
      <h4 className={["scan-status_title", (Number.isInteger(count) ? '' : 'scan-status_title-no-results')].join(' ')}>
        { results }
      </h4>
      <div className="scan-status_details">
        {children}
      </div>
    </div>
  );
};

ScanResultsSummary.propTypes = {
  status: PropTypes.string.isRequired,
  count: PropTypes.number,

};

ScanResultsSummary.defaultProps = {
  count: null,
};

// export default React.memo(ScanResultsSummary);
export default ScanResultsSummary;
