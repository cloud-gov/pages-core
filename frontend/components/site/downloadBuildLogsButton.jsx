import React from 'react';
import PropTypes from 'prop-types';
import fileDownload from 'js-file-download';
import { BUILD_LOG } from '../../propTypes';
import { groupLogs } from '../../util';

class DownloadBuildLogsButton extends React.Component {
  constructor(props) {
    super(props);
    this.downloadBuildLogs = this.downloadBuildLogs.bind(this);
  }

  downloadBuildLogs() {
    const { buildLogsData = [], buildId } = this.props;
    const groupedLogs = groupLogs(buildLogsData);
    const text = Object.keys(groupedLogs).map(source => `${source}\n${groupedLogs[source].join('\n')}`).join('\n\n');
    fileDownload(text, `build-log-${buildId}.txt`);
  }

  render() {
    return (
      <button type="button" className="usa-button" onClick={this.downloadBuildLogs}>Download logs</button>
    );
  }
}

DownloadBuildLogsButton.propTypes = {
  buildLogsData: PropTypes.arrayOf(BUILD_LOG).isRequired,
  buildId: PropTypes.number.isRequired,
};

export default DownloadBuildLogsButton;
