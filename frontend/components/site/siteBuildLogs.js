import React from 'react';
import PropTypes from 'prop-types';

import buildLogActions from '../../actions/buildLogActions';
import LoadingIndicator from '../loadingIndicator';
import SiteBuildLogTable from './siteBuildLogTable';
import RefreshBuildLogsButton from './refreshBuildLogsButton';

import { API } from '../../util/federalistApi';


class SiteBuildLogs extends React.Component {
  componentDidMount() {
    buildLogActions.fetchBuildLogs({ id: this.props.params.buildId });
  }

  render() {
    const { buildLogs } = this.props;
    const buildId = parseInt(this.props.params.buildId, 10);

    if (buildLogs.isLoading) {
      return <LoadingIndicator />;
    }

    // else
    if (!buildLogs.data || !buildLogs.data.length) {
      return (
        <div>
          <p>This build does not have any build logs.</p>
          <RefreshBuildLogsButton buildId={buildId} />
        </div>
      );
    }

    // else
    const downloadUrl = `${API}/build/${buildId}/log?format=text`;
    const downloadName = `build-log-${buildId}.txt`;

    return (
      <div>
        <div className="log-tools">
          <ul className="usa-unstyled-list">
            <li><a href={downloadUrl} download={downloadName}>Download logs</a></li>
            <li><RefreshBuildLogsButton buildId={buildId} /></li>
          </ul>
        </div>
        <SiteBuildLogTable buildLogs={buildLogs.data} />
      </div>
    );
  }
}

SiteBuildLogs.propTypes = {
  params: PropTypes.shape({
    buildId: PropTypes.string.isRequired,
  }).isRequired,
  buildLogs: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.array,
  }),
};

SiteBuildLogs.defaultProps = {
  buildLogs: null,
};

export default SiteBuildLogs;
