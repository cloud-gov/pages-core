import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import fileDownload from 'js-file-download';

class DownloadBuildLogsButton extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this, 'downloadBuildLogs');
  }

  downloadBuildLogs() {
    let buildLogsData = this.props.buildLogsData || [];
    buildLogsData = buildLogsData.map(data => [`Source: ${data.source}`, `Timestamp: ${(new Date(data.createdAt)).toISOString()}`, `Output:\n${data.output}`].join('\n'));
    fileDownload(buildLogsData.join('\n\n'), `build-log-${this.props.buildId}.txt`);
  }

  render() {
    return (
      <button className="usa-button" onClick={this.downloadBuildLogs}>Download logs</button>
    );
  }
}

DownloadBuildLogsButton.propTypes = {
  buildLogsData: PropTypes.array.isRequired,
  buildId: PropTypes.number.isRequired,
};

export default DownloadBuildLogsButton;
