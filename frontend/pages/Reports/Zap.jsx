import React from 'react';
import PropTypes from 'prop-types';
import ScanLayout from './ScanLayout.jsx';

export default function Zap({ data }) {

  function prepareProps(data){
    return {
      site: {...data.site},
      buildId: data.buildId || 'missing build id',
      generated: data.default.generated || 'on unknown date',
      alerts: data.default.site.alerts || [],
      groupedAlerts: data.default.site.groupedAlerts || {}
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
