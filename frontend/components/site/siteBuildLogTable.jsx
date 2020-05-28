import React from 'react';
import PropTypes from 'prop-types';

import { BUILD_LOG } from '../../propTypes';
import { groupLogs } from '../../util';

function SiteBuildLogTable({ buildLogs }) {
  const groupedLogs = groupLogs(buildLogs);

  return (
    <pre className="build-log">
      {Object.keys(groupedLogs).map(source => (
        <React.Fragment key={source}>
          {source !== 'ALL' && (
            <span className="log-source-header">{source}</span>
          )}
          {groupedLogs[source].join('\n')}
        </React.Fragment>
      ))}
    </pre>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: PropTypes.arrayOf(BUILD_LOG).isRequired,
};

export default SiteBuildLogTable;
