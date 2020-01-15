import React from 'react';
import PropTypes from 'prop-types';

import { BUILD_LOG } from '../../propTypes';
import { groupLogs } from '../../util';

function SiteBuildLogTable({ buildLogs }) {
  const groupedLogs = groupLogs(buildLogs);

  return (
    <table className="usa-table-borderless log-table log-table__site-build-log table-full-width">
      <tbody className="log-data">
        {Object.keys(groupedLogs).map(source => (
          <tr>
            <td>
              {source !== 'ALL' && (
              <pre className="log-source-header">
                <span>{source}</span>
              </pre>
              )}
              <pre>
                {groupedLogs[source].join('\n')}
              </pre>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: PropTypes.arrayOf(BUILD_LOG).isRequired,
};

export default SiteBuildLogTable;
