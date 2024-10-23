/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';

function DownloadBuildLogsButton(props) {
  function downloadBuildLogs() {
    const { buildLogsData = [], buildId } = props;
    const text = buildLogsData.map(source => `${source}\n`);
    const blob = new Blob([text], { type: 'text/plain' });
    const aElement = document.createElement('a');
    aElement.setAttribute('download', `build-log-${buildId}.txt`);
    const href = URL.createObjectURL(blob);
    aElement.href = href;
    aElement.setAttribute('target', '_blank');
    aElement.click();
    URL.revokeObjectURL(href);
  }

  return (
    <button type="button" className="usa-button" onClick={downloadBuildLogs}>Download logs</button>
  );
}

DownloadBuildLogsButton.propTypes = {
  buildLogsData: PropTypes.array.isRequired,
  buildId: PropTypes.number.isRequired,
};

export default DownloadBuildLogsButton;
