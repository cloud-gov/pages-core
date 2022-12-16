/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import fileDownload from 'js-file-download';

function DownloadBuildLogsButton(props) {
  function downloadBuildLogs() {
    const { buildLogsData = [], buildId } = props;
    const text = buildLogsData.map(source => `${source}\n`);
    fileDownload(text, `build-log-${buildId}.txt`);
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
