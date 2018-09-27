import React from 'react';
import PropTypes from 'prop-types';

import { BUILD_LOG } from '../../propTypes';

function SiteBuildLogTable({ buildLogs }) {
  return (
    <table className="usa-table-borderless log-table log-table__site-build-log table-full-width">
      <thead>
        <tr>
          <th>Task<br />Timestamp (UTC)</th>
          <th>Output</th>
        </tr>
      </thead>
      <tbody>
        {buildLogs.map((log => (
          <tr key={log.id}>
            <td>{log.source}
              <br />
              {log.createdAt.split('T')[0]}
              <br />
              {log.createdAt.split('T')[1].split('Z')[0].split('.')[0]}
            </td>
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
