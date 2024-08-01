import React from 'react';
import PropTypes from 'prop-types';
import ScanLayout from './ScanLayout.jsx';

export default function Zap({ data }) {

  function prepareProps(data){
    return {
      site: {...data.site},
      buildId: data.buildId || 'missing build id',
      generated: data.generated || 'on unknown date',
      alerts: data.site.alerts || [],
      groupedAlerts: data.site.groupedAlerts || {}
    }
  }

  return (
    <div>
      <ScanLayout {...prepareProps(data)} />
      <details>
        <summary>View JSON</summary>
        <pre>{JSON.stringify(data, null, "  ")}</pre>
      </details>
    </div>
  );
}

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
