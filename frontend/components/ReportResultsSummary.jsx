import React from 'react';
import PropTypes from 'prop-types';

import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner, IconX, IconIgnore,
} from './icons';

const reportResultsIcon = (status, count) => {
  let icon;
  let results;
  switch (status) {
    case 'error':
      results = 'Report failed';
      icon = IconX;
      break;
    // this case should never happen, unless we want to show cancelled scans
    case 'cancelled':
      results = 'Report cancelled';
      icon = IconIgnore;
      break;
    case 'processing':
      results = 'Generating report';
      icon = IconSpinner;
      break;
    case 'queued':
    case 'created':
      results = 'Report queued';
      icon = IconClock;
      break;
    case 'success':
      if (count === 1) {
        icon = IconExclamationCircle;
        results = '1 issue found';
      } else if (count > 1) {
        icon = IconExclamationCircle;
        results = `${count} issues found`;
      } else {
        icon = IconCheckCircle;
        results = 'No issues found';
      }
      break;
    default:
      icon = null;
  }
  return { icon, results };
};

const ReportResultsSummary = (props) => {
  const { status, count, children } = props;
  const { icon, results } = reportResultsIcon(status, count);

  return (
    <div className="scan-status">
      { icon && (
        <span className="scan-status-icon">
          { React.createElement(icon) }
        </span>
      )}
      <h4 className={['scan-status-title', (Number.isInteger(count) ? '' : 'scan-status-title-no-results')].join(' ')}>
        { results }
      </h4>
      <div className="scan-status-details">
        {children}
      </div>
    </div>
  );
};

ReportResultsSummary.propTypes = {
  status: PropTypes.string.isRequired,
  count: PropTypes.number,
  children: PropTypes.node,
};

ReportResultsSummary.defaultProps = {
  count: null,
  children: null,
};

export default ReportResultsSummary;
