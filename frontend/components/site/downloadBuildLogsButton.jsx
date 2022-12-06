/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import fileDownload from 'js-file-download';

class DownloadBuildLogsButton extends React.Component {
  constructor(props) {
    super(props);
    this.downloadBuildLogs = this.downloadBuildLogs.bind(this);
  }

  downloadBuildLogs() {
    const { buildLogsData = [], buildId } = this.props;
    const text = buildLogsData.map(source => `${source}\n`);
    fileDownload(text, `build-log-${buildId}.txt`);
  }

  render() {
    return (
      <button type="button" className="usa-button" onClick={this.downloadBuildLogs}>Download logs</button>
    );
  }
}

DownloadBuildLogsButton.propTypes = {
  buildLogsData: PropTypes.array.isRequired,
  buildId: PropTypes.number.isRequired,
};

export default DownloadBuildLogsButton;
