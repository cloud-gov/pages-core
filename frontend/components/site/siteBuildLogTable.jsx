import React from 'react';
import PropTypes from 'prop-types';

import { BUILD_LOG } from '../../propTypes';

function SiteBuildLogTable({ buildLogs }) {
  return (
    <table className="usa-table-borderless log-table log-table__site-build-log">
      <thead>
        <tr>
          <th>Source</th>
          <th>Output</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {buildLogs.map((log => (
          <tr key={log.id}>
            <td>{log.source}</td>
            <td>
              <pre>
                {log.output}
              </pre>
            </td>
            <td>{log.createdAt}</td>
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
