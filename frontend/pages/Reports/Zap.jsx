import React from 'react';
import PropTypes from 'prop-types';
import ScanLayout from './ScanLayout.jsx';

export default function Zap({ data }) {

  function prepareProps(data){
    return {
      site: {...data.site},
      buildId: data.buildId || 'missing build id',
      generated: data.site.generated || 'on unknown date',
      alerts: data.site.alerts || [],
      groupedAlerts: data.site.groupedAlerts || {}
    }
  }

  return (
    <div>
      <ScanLayout {...prepareProps(data)} />
      <hr />
      <pre>{JSON.stringify(data, null, "  ")}</pre>
    </div>
  );
}

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
