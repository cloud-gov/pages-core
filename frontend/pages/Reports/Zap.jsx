import React from 'react';
import PropTypes from 'prop-types';
import ScanLayout from './ScanLayout.jsx';

export default function Zap({ data }) {
  console.log(data.site.alerts)
  function prepareProps(data){
    return {
      site: {...data.site},
      buildId: data.buildId || 'missing build id',
      generated: data.generated || 'on unknown date',
      alerts: data.site.alerts || [],
      groupedAlerts: data.site.groupedAlerts || {},
      scanType: 'zap'
    }
  }

  return (
    <div>
      <ScanLayout {...prepareProps(data)} />
    </div>
  );
}

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
