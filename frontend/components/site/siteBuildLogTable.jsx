import React from 'react';
import PropTypes from 'prop-types';

import { BUILD_LOG } from '../../propTypes';
import { timestampUTC } from '../../util/datetime';

function SiteBuildLogTable({ buildLogs }) {
  return (
    <table className="usa-table-borderless log-table log-table__site-build-log table-full-width">
      <thead>
        <tr>
          <th>Source<br/>Timestamp (UTC)</th>
          <th>Output</th>
        </tr>
      </thead>
      <tbody>
        {buildLogs.map((log => (
          <tr key={log.id}>
            <td>{log.source}<br/>{timestampUTC(log.createdAt)}</td>
            <td>
              <pre>
                {log.output}
              </pre>
            </td>
          </tr>
        )))}
      </tbody>
    </table>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: PropTypes.arrayOf(BUILD_LOG).isRequired,
};

export default SiteBuildLogTable;
